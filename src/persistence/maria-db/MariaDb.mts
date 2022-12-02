import {
  MariaDatabaseSpec,
  PersistentRow,
  Row_Article,
  Row_Emission,
  Row_ImageContent,
  Row_ImageReference,
  Row_Receipt,
  Row_Store,
  Row_StoreSection,
} from "jm-castle-warehouse-types";
import { createPool, Pool } from "mariadb";
import { Persistence } from "../Types.mjs";
import {
  insert as insertArticle,
  select as selectFromArticle,
  update as updateArticle,
} from "./query/Article.mjs";
import {
  insert as insertEmission,
  select as selectFromEmission,
} from "./query/Emission.mjs";
import {
  insert as insertImageContent,
  select as selectFromImageContent,
  update as updateImageContent,
} from "./query/ImageContent.mjs";
import {
  insert as insertImageReference,
  select as selectFromImageReference,
  update as updateImageReference,
} from "./query/ImageReference.mjs";
import {
  Filter_At_FromTo_Seconds,
  Filter_ImageExtension,
  Filter_ImageId,
  Filter_NameLike,
  Filter_Reference,
} from "./query/QueryUtils.mjs";
import {
  insert as insertReceipt,
  select as selectFromReceipt,
} from "./query/Receipt.mjs";
import {
  insert as insertStore,
  select as selectFromStore,
  update as updateStore,
} from "./query/Store.mjs";
import {
  insert as insertStoreSection,
  select as selectFromStoreSection,
  update as updateStoreSection,
} from "./query/StoreSection.mjs";
import { TableArticle } from "./tables/Article.mjs";
import { TableEmission } from "./tables/Emission.mjs";
import { TableImageContent } from "./tables/ImageContent.mjs";
import { TableImageReference } from "./tables/ImageReference.mjs";
import { TableReceipt } from "./tables/Receipt.mjs";
import { TableStore } from "./tables/Store.mjs";
import { TableStoreSection } from "./tables/StoreSection.mjs";

export interface RunPartsResponse {
  // milliseconds of duration to run all parts
  duration: number;
  errors?: string[];
}

export const AllTables = [
  TableImageReference,
  TableImageContent,
  TableStore,
  TableStoreSection,
  TableArticle,
  TableReceipt,
  TableEmission,
];

export interface MariaDbClientProps {
  persistenceId: string;
  spec: MariaDatabaseSpec;
}

export class MariaDbClient implements Persistence {
  constructor(props: MariaDbClientProps) {
    const { spec } = props;
    this.spec = spec;
    return this;
  }
  private setupPool: Pool | undefined;
  private databasePool: Pool | undefined;
  private spec: MariaDatabaseSpec;
  private handlePoolError = (error: Error) =>
    console.error("Received error from database pool: " + error.toString());
  public type = () => "maria-db";
  public getDatabaseName = () => this.spec.database;
  public getDatabasePool = () => {
    if (!this.databasePool) {
      const { host, port, user, password, database } = this.spec;
      this.databasePool = createPool({
        host,
        port,
        user,
        password,
        database,
        connectionLimit: 10,
        decimalAsNumber: true,
      });
      // eslint-disable-next-line
      // @ts-ignore
      this.databasePool.on("error", this.handlePoolError);
    }
    return this.databasePool;
  };
  public getSetupPool = () => {
    if (!this.setupPool) {
      const { host, port, user, password, database } = this.spec;
      this.setupPool = createPool({
        host,
        port,
        user,
        password,
        connectionLimit: 1,
      });
    }
    return this.setupPool;
  };
  public tables = {
    imageReference: {
      insert: (values: Row_ImageReference & PersistentRow) =>
        insertImageReference(values, this),
      update: (values: Row_ImageReference & PersistentRow) =>
        updateImageReference(values, this),
      select: (filter: Filter_ImageId | Filter_Reference) =>
        selectFromImageReference(filter, this),
    },
    imageContent: {
      insert: (values: Row_ImageContent & PersistentRow) =>
        insertImageContent(values, this),
      update: (values: Row_ImageContent & PersistentRow) =>
        updateImageContent(values, this),
      select: (filter: Filter_ImageId | Filter_ImageExtension) =>
        selectFromImageContent(filter, this),
    },
    store: {
      insert: (values: Row_Store & PersistentRow) => insertStore(values, this),
      update: (values: Row_Store & PersistentRow) => updateStore(values, this),
      select: (filter: Filter_NameLike) => selectFromStore(filter, this),
    },
    storeSection: {
      insert: (values: Row_StoreSection & PersistentRow) =>
        insertStoreSection(values, this),
      update: (values: Row_StoreSection & PersistentRow) =>
        updateStoreSection(values, this),
      select: (filter: Filter_NameLike) => selectFromStoreSection(filter, this),
    },
    article: {
      insert: (values: Row_Article & PersistentRow) =>
        insertArticle(values, this),
      update: (values: Row_Article & PersistentRow) =>
        updateArticle(values, this),
      select: (filter: Filter_NameLike) => selectFromArticle(filter, this),
    },
    receipt: {
      insert: (values: Row_Receipt & PersistentRow) =>
        insertReceipt(values, this),
      select: (filter: Filter_At_FromTo_Seconds) =>
        selectFromReceipt(filter, this),
    },
    emission: {
      insert: (values: Row_Emission & PersistentRow) =>
        insertEmission(values, this),
      select: (filter: Filter_At_FromTo_Seconds) =>
        selectFromEmission(filter, this),
    },
  };

  public disconnect = async () => {
    console.log(
      "Disconnecting from Maria Db would cause errors when building new pools..."
    );
    if (this.setupPool) {
      // cannot do this: await this.setupPool.end();
    }
    if (this.databasePool) {
      // cannot do this: await this.databasePool.end();
    }
  };
}
