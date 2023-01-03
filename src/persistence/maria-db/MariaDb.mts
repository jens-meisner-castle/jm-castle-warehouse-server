import {
  DbExportData,
  ErrorCode,
  MariaDatabaseSpec,
  PersistentRow,
  Row_Article,
  Row_Emission,
  Row_ImageContent,
  Row_ImageReference,
  Row_Receipt,
  Row_Store,
  Row_StoreSection,
  SelectResponse,
  UnknownErrorCode,
} from "jm-castle-warehouse-types";
import { createPool, Pool } from "mariadb";
import { ErrorWithCode } from "../../utils/Basic.mjs";
import { Persistence } from "../Types.mjs";
import {
  all as allFromArticle,
  insert as insertArticle,
  select as selectFromArticle,
  update as updateArticle,
} from "./query/Article.mjs";
import {
  all as allFromEmission,
  insert as insertEmission,
  select as selectFromEmission,
} from "./query/Emission.mjs";
import {
  all as allFromImageContent,
  insert as insertImageContent,
  select as selectFromImageContent,
  update as updateImageContent,
} from "./query/ImageContent.mjs";
import {
  all as allFromImageReference,
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
  all as allFromReceipt,
  insert as insertReceipt,
  select as selectFromReceipt,
} from "./query/Receipt.mjs";
import {
  all as allFromStore,
  insert as insertStore,
  select as selectFromStore,
  update as updateStore,
} from "./query/Store.mjs";
import {
  all as allFromStoreSection,
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
  public version = "1.0.0";
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

  private exportSingleTableData = async function <T>(access: {
    all: () => Promise<SelectResponse<T>>;
  }): Promise<{ rows: T[] }> {
    const { result, error, errorCode } = await access.all();
    if (error) {
      throw new ErrorWithCode(errorCode || UnknownErrorCode, error);
    }
    return { rows: result.rows };
  };

  public exportTableData = async (): Promise<
    { tables: DbExportData["tables"] } | { error: string; errorCode: ErrorCode }
  > => {
    try {
      const article = await this.exportSingleTableData(this.tables.article);
      const store = await this.exportSingleTableData(this.tables.store);
      const storeSection = await this.exportSingleTableData(
        this.tables.storeSection
      );
      const receipt = await this.exportSingleTableData(this.tables.receipt);
      const emission = await this.exportSingleTableData(this.tables.emission);
      const imageReference = await this.exportSingleTableData(
        this.tables.imageReference
      );
      const imageContent = await this.exportSingleTableData(
        this.tables.imageContent
      );
      const tables: DbExportData["tables"] = {
        article,
        store,
        storeSection,
        receipt,
        emission,
        imageReference,
        imageContent,
      };
      return { tables };
    } catch (error: unknown) {
      return {
        error: (error as ErrorWithCode).toString(),
        errorCode: (error as ErrorWithCode).code,
      };
    }
  };
  public tables = {
    imageReference: {
      insert: (values: Row_ImageReference & PersistentRow) =>
        insertImageReference(values, this),
      update: (values: Row_ImageReference & PersistentRow) =>
        updateImageReference(values, this),
      select: (filter: Filter_ImageId | Filter_Reference) =>
        selectFromImageReference(filter, this),
      all: () => allFromImageReference(this),
    },
    imageContent: {
      insert: (values: Row_ImageContent & PersistentRow) =>
        insertImageContent(values, this),
      update: (values: Row_ImageContent & PersistentRow) =>
        updateImageContent(values, this),
      select: (filter: Filter_ImageId | Filter_ImageExtension) =>
        selectFromImageContent(filter, this),
      all: () => allFromImageContent(this),
    },
    store: {
      insert: (values: Row_Store & PersistentRow) => insertStore(values, this),
      update: (values: Row_Store & PersistentRow) => updateStore(values, this),
      select: (filter: Filter_NameLike) => selectFromStore(filter, this),
      all: () => allFromStore(this),
    },
    storeSection: {
      insert: (values: Row_StoreSection & PersistentRow) =>
        insertStoreSection(values, this),
      update: (values: Row_StoreSection & PersistentRow) =>
        updateStoreSection(values, this),
      select: (filter: Filter_NameLike) => selectFromStoreSection(filter, this),
      all: () => allFromStoreSection(this),
    },
    article: {
      insert: (values: Row_Article & PersistentRow) =>
        insertArticle(values, this),
      update: (values: Row_Article & PersistentRow) =>
        updateArticle(values, this),
      select: (filter: Filter_NameLike) => selectFromArticle(filter, this),
      all: () => allFromArticle(this),
    },
    receipt: {
      insert: (values: Row_Receipt & PersistentRow) =>
        insertReceipt(values, this),
      select: (filter: Filter_At_FromTo_Seconds) =>
        selectFromReceipt(filter, this),
      all: () => allFromReceipt(this),
    },
    emission: {
      insert: (values: Row_Emission & PersistentRow) =>
        insertEmission(values, this),
      select: (filter: Filter_At_FromTo_Seconds) =>
        selectFromEmission(filter, this),
      all: () => allFromEmission(this),
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
