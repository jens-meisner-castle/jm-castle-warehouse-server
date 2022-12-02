import fs from "fs";
import {
  CheckedConfiguration,
  Configuration,
  FilesystemStoreSpec,
  ImageStoreSpec,
  MailingSpec,
  PersistenceSpec,
  SystemSpec,
  SystemStatus,
} from "jm-castle-warehouse-types";
import { DateTime } from "luxon";
import {
  configFilePath,
  readJsonFile,
  replacePasswordInObject,
} from "../../configuration/Configuration.mjs";
import { ImageFileStore } from "../../image-store/ImageFileStore.mjs";
import { getMailSender } from "../../mail/Mail.mjs";
import { MailSender } from "../../mail/Types.mjs";
import { getPersistence } from "../../persistence/Persistence.mjs";
import { Persistence } from "../../persistence/Types.mjs";
import { getDateFormat } from "../../utils/Format.mjs";

let CurrentSystem: CastleWarehouse | undefined = undefined;

export const setCurrentSystem = (system: CastleWarehouse) => {
  CurrentSystem = system;
};

export const getCurrentSystem = () => CurrentSystem;

export class CastleWarehouse {
  constructor(configuration: Configuration) {
    const { validConfig, errors } = this.checkConfiguration(configuration);
    this.configuration = {
      ...configuration,
      isValid: !errors || !errors.length,
    };
    this.validConfig = validConfig;
    this.systemName = validConfig.system?.name || "no name";
    this.configErrors = errors;
    errors && console.error(...errors);
  }
  private systemName: string;
  private startedAt = Date.now();
  private configuration: CheckedConfiguration;
  private configErrors: string[] | undefined;
  private validConfig: CheckedConfiguration;

  private imageStore: ImageFileStore;
  private persistence: Record<string, Persistence> = {};
  private defaultPersistence: Persistence | undefined = undefined;
  private mailSenders: Record<string, MailSender> = {};
  private defaultMailSender: MailSender | undefined = undefined;

  private caCert: Buffer | null | undefined = undefined;
  private serverCert: Buffer;
  private serverKey: Buffer;

  public start = async () => {
    await this.setupMailSenders();
    if (this.defaultMailSender) {
      const config = JSON.stringify(this.configuration);
      try {
        await this.defaultMailSender.send(
          `starting ${
            this.validConfig.system?.name || "castle-ac-dc"
          } at ${DateTime.now().toFormat(getDateFormat("second"))}`,
          JSON.stringify({ config: { length: config.length } })
        );
      } catch (error) {
        console.error(error);
      }
    }
    await this.setupPersistence();
    await this.setupImageStore();
  };

  public getImageStorePath = () => this.validConfig.imageStore.path;

  public getOwnApiUrl = () => {
    const { host, port } = this.validConfig.system;
    return `https://${host}:${port}/api`;
  };

  public getOwnPort = () => this.validConfig.system.port;

  public getCACertificate = (): Buffer | null | undefined => {
    if (this.caCert === undefined) {
      const path = this.validConfig.system.certs.ca;
      this.caCert = path ? fs.readFileSync(path) : null;
    }
    return this.caCert;
  };

  public getServerCertificate = () => {
    if (!this.serverCert) {
      const path = this.validConfig.system.certs.hostCert;
      this.serverCert = fs.readFileSync(path);
    }
    return this.serverCert;
  };

  public getServerKey = () => {
    if (!this.serverKey) {
      const path = this.validConfig.system.certs.hostKey;
      this.serverKey = fs.readFileSync(path);
    }
    return this.serverKey;
  };

  private disconnectFromAllPersistences = async () => {
    const persistenceKeys = Object.keys(this.persistence);
    for (let i = 0; i < persistenceKeys.length; i++) {
      const k = persistenceKeys[i];
      const persistence = this.persistence[k];
      await persistence.disconnect();
    }
  };

  private disconnectFromAllMailSenders = async () => {
    const mailSenderKeys = Object.keys(this.mailSenders);
    for (let i = 0; i < mailSenderKeys.length; i++) {
      const k = mailSenderKeys[i];
      const mailSender = this.mailSenders[k];
      await mailSender.disconnect();
    }
  };

  /**
   * Disconnect all persistences and remove all
   * Disconnect all mail senders and remove all
   * Start again
   */
  public restart = async () => {
    await this.disconnectFromAllPersistences();
    this.persistence = {};
    this.defaultPersistence = undefined;
    await this.disconnectFromAllMailSenders();
    this.mailSenders = {};
    this.defaultMailSender = undefined;
    const filePath = configFilePath();
    console.log("reading config from file:", filePath);
    const configuration = readJsonFile<Configuration>(filePath);
    const newSystem = new CastleWarehouse(configuration);
    setCurrentSystem(newSystem);
    await newSystem.start();
  };

  private checkSystemSpec = (
    spec: SystemSpec,
    validConfig: Configuration,
    errors: string[]
  ): boolean => {
    const { name, host, port, certs } = spec;
    if (name && typeof name !== "string") {
      errors.push(
        `Bad system spec: If used the property "name" must have a string as value. Found type "${typeof name}".`
      );
      return false;
    }
    if (typeof host !== "string") {
      errors.push(
        `Bad system spec: The property "host" must have a string as value. Found type "${typeof name}".`
      );
      return false;
    }
    if (typeof port !== "number") {
      errors.push(
        `Bad system spec: The property "port" must have a number as value. Found type "${typeof name}".`
      );
      return false;
    }
    if (typeof certs !== "object") {
      errors.push(
        `Bad system spec: The property "certs" must have an object as value. Found type "${typeof name}".`
      );
      return false;
    }
    const { ca, hostCert, hostKey } = certs;
    if (ca && typeof ca !== "string") {
      errors.push(
        `Bad system spec: If used the property "ca" (within "certs") must have a string as value. Found type "${typeof name}".`
      );
      return false;
    }
    if (typeof hostCert !== "string") {
      errors.push(
        `Bad system spec: The property "hostCert" (within "certs") must have a string as value. Found type "${typeof name}".`
      );
      return false;
    }
    if (typeof hostKey !== "string") {
      errors.push(
        `Bad system spec: The property "hostKey" (within "certs") must have a string as value. Found type "${typeof name}".`
      );
      return false;
    }
    validConfig.system = spec;
    return true;
  };

  private checkImageStoreSpec = (
    spec: FilesystemStoreSpec & ImageStoreSpec,
    validConfig: Configuration,
    errors: string[]
  ): boolean => {
    const { type, path, maxWidth, maxHeight } = spec;
    if (type !== "file-system") {
      errors.push(
        `Bad imageStore spec: Currently is only "file-system" as type possible. Found type "${type}".`
      );
      return false;
    }
    if (typeof path !== "string") {
      errors.push(
        `Bad imageStore spec: The property "path" must be a string, but is ${typeof path}.`
      );
      return false;
    }
    if (typeof maxWidth !== "number") {
      errors.push(
        `Bad imageStore spec: The property "maxWidth" must be a number, but is ${typeof maxWidth}.`
      );
      return false;
    }
    if (typeof maxHeight !== "number") {
      errors.push(
        `Bad imageStore spec: The property "maxHeight" must be a number, but is ${typeof maxHeight}.`
      );
      return false;
    }
    validConfig.imageStore = spec;
    return true;
  };

  private checkPersistenceSpec = (
    key: string,
    spec: PersistenceSpec,
    validConfig: Configuration,
    errors: string[]
  ): boolean => {
    const { host, database, password, port, type, user } = spec;
    if (type !== "maria-db") {
      errors.push(
        `Bad persistence ${key}: Currently is only a MariaDB possible as persistence. Found type "${type}".`
      );
      return false;
    }
    if (typeof host !== "string") {
      errors.push(
        `Bad persistence ${key}: The property "host" must be a string, but is ${typeof host}.`
      );
      return false;
    }
    if (typeof database !== "string") {
      errors.push(
        `Bad persistence ${key}: The property "database" must be a string, but is ${typeof database}.`
      );
      return false;
    }
    if (typeof password !== "string") {
      errors.push(
        `Bad persistence ${key}: The property "password" must be a string, but is ${typeof password}.`
      );
      return false;
    }
    if (typeof user !== "string") {
      errors.push(
        `Bad persistence ${key}: The property "user" must be a string, but is ${typeof user}.`
      );
      return false;
    }
    if (typeof port !== "number") {
      errors.push(
        `Bad persistence ${key}: The property "port" must be a number, but is ${typeof port}.`
      );
      return false;
    }
    validConfig.persistence[key] = spec;
    return true;
  };

  private checkMailingSpec = (
    key: string,
    spec: MailingSpec,
    validConfig: Configuration,
    errors: string[]
  ): boolean => {
    const { host, password, port, type, user } = spec;
    if (type !== "smtp") {
      errors.push(
        `Bad mailing spec ${key}: Currently is only "smtp" possible as type of mailing spec. Found type "${type}".`
      );
      return false;
    }
    if (typeof host !== "string") {
      errors.push(
        `Bad mailing spec ${key}: The property "host" must be a string, but is ${typeof host}.`
      );
      return false;
    }
    if (typeof password !== "string") {
      errors.push(
        `Bad mailing spec ${key}: The property "password" must be a string, but is ${typeof password}.`
      );
      return false;
    }
    if (typeof user !== "string") {
      errors.push(
        `Bad mailing spec ${key}: The property "user" must be a string, but is ${typeof user}.`
      );
      return false;
    }
    if (typeof port !== "number") {
      errors.push(
        `Bad mailing spec ${key}: The property "port" must be a number, but is ${typeof port}.`
      );
      return false;
    }
    validConfig.mail[key] = spec;
    return true;
  };

  public checkConfiguration = (
    configuration: Configuration
  ): { validConfig: CheckedConfiguration; errors: string[] | undefined } => {
    try {
      const { persistence, mail, system, imageStore } = configuration;
      const validConfig: CheckedConfiguration = {
        isValid: true,
        system: {
          host: "localhost",
          port: 53001,
          certs: {
            ca: "cert/not-available.pem",
            hostCert: "cert/not-available.crt",
            hostKey: "cert/not-available.key",
          },
        },
        persistence: {},
        mail: {},
        imageStore: {
          type: "file-system",
          path: "none",
          maxWidth: 400,
          maxHeight: 400,
        },
      };
      const errors: string[] = [];
      system && this.checkSystemSpec(system, validConfig, errors);
      imageStore && this.checkImageStoreSpec(imageStore, validConfig, errors);
      persistence &&
        Object.keys(persistence).forEach((k) => {
          const persistenceSpec = persistence[k];
          if (!persistenceSpec) {
            errors.push(
              `Each value in property "persistence" must be a persistence specification.`
            );
          } else {
            this.checkPersistenceSpec(k, persistenceSpec, validConfig, errors);
          }
        });
      mail &&
        Object.keys(mail).forEach((k) => {
          const mailingSpec = mail[k];
          if (!mailingSpec) {
            errors.push(
              `Each value in property "mail" must be a mailing specification.`
            );
          } else {
            this.checkMailingSpec(k, mailingSpec, validConfig, errors);
          }
        });
      return { validConfig, errors: errors.length ? errors : undefined };
    } catch (error) {
      return {
        validConfig: {
          system: {
            host: "localhost",
            port: 53001,
            certs: {
              ca: "cert/not-available.pem",
              hostCert: "cert/not-available.crt",
              hostKey: "cert/not-available.key",
            },
          },
          persistence: {},
          mail: {},
          imageStore: {
            type: "file-system",
            path: "none",
            maxWidth: 400,
            maxHeight: 400,
          },
        },
        errors: [error.toString()],
      };
    }
  };

  private setupPersistence = async () => {
    Object.keys(this.validConfig.persistence).forEach((k) => {
      const persistenceSpec = this.validConfig.persistence[k];
      const { isDefault } = persistenceSpec;
      const persistence = getPersistence(k, persistenceSpec);
      this.persistence[k] = persistence;
      if (isDefault) {
        this.defaultPersistence = persistence;
      }
    });
  };

  private setupImageStore = async () => {
    this.imageStore = new ImageFileStore(this.validConfig.imageStore);
    return;
  };

  private setupMailSenders = async () => {
    Object.keys(this.validConfig.mail).forEach((k) => {
      const mailingSpec = this.validConfig.mail[k];
      const { isDefault } = mailingSpec;
      const mailSender = getMailSender(mailingSpec);
      this.mailSenders[k] = mailSender;
      if (isDefault) {
        this.defaultMailSender = mailSender;
      }
    });
  };

  public getImageStore = () => this.imageStore;

  public getStatus = async (): Promise<SystemStatus> => {
    const cleanConfig = JSON.parse(JSON.stringify(this.configuration));
    replacePasswordInObject(cleanConfig);
    const cleanValidConfig = JSON.parse(JSON.stringify(this.validConfig));
    replacePasswordInObject(cleanValidConfig);
    return {
      startedAt: this.startedAt,
      configuration: {
        content: cleanConfig,
        errors: this.configErrors,
        valid: cleanValidConfig,
      },
    };
  };

  public getDefaultPersistence = () => this.defaultPersistence;
}
