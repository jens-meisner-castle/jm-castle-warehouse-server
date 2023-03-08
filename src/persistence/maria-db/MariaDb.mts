import {
  DbExportData,
  ErrorCode,
  MariaDatabaseSpec,
  PersistentRow,
  Row_Article,
  Row_Attribute,
  Row_Costunit,
  Row_Emission,
  Row_Hashtag,
  Row_ImageContent,
  Row_ImageReference,
  Row_Manufacturer,
  Row_Receipt,
  Row_Receiver,
  Row_Store,
  Row_StoreSection,
  SelectResponse,
  Table,
  UnknownErrorCode,
} from "jm-castle-warehouse-types";
import { createPool, Pool } from "mariadb";
import { ErrorWithCode } from "../../utils/Basic.mjs";
import {
  AggreagtionFunction,
  Persistence,
  TableRowsChangeConsumer,
} from "../Types.mjs";
import {
  all as allFromArticle,
  insert as insertArticle,
  select as selectFromArticle,
  selectByKey as selectByKeyFromArticle,
  update as updateArticle,
} from "./query/Article.mjs";
import {
  all as allFromAttribute,
  insert as insertAttribute,
  select as selectFromAttribute,
  selectByKey as selectByKeyFromAttribute,
  update as updateAttribute,
} from "./query/Attribute.mjs";
import {
  all as allFromCostunit,
  insert as insertCostunit,
  select as selectFromCostunit,
  selectByKey as selectByKeyFromCostunit,
  update as updateCostunit,
} from "./query/Costunit.mjs";
import {
  all as allFromEmission,
  insert as insertEmission,
  select as selectFromEmission,
  selectGroupBy as selectGroupByFromEmission,
} from "./query/Emission.mjs";
import {
  all as allFromHashtag,
  insert as insertHashtag,
  select as selectFromHashtag,
  selectByKey as selectByKeyFromHashtag,
  update as updateHashtag,
} from "./query/Hashtag.mjs";
import {
  all as allFromImageContent,
  insert as insertImageContent,
  select as selectFromImageContent,
  selectLikeImageId as selectFromImageContentLikeImageId,
  update as updateImageContent,
} from "./query/ImageContent.mjs";
import {
  all as allFromImageReference,
  insert as insertImageReference,
  insertImageReferences,
  select as selectFromImageReference,
  update as updateImageReference,
  updateImageReferences,
} from "./query/ImageReference.mjs";
import {
  all as allFromManufacturer,
  insert as insertManufacturer,
  select as selectFromManufacturer,
  selectByKey as selectByKeyFromManufacturer,
  update as updateManufacturer,
} from "./query/Manufacturer.mjs";
import {
  Filter_At_FromTo_Seconds,
  Filter_Hashtag,
  Filter_ImageExtension,
  Filter_ImageId,
  Filter_NameLike,
  Filter_Reference,
} from "./query/QueryUtils.mjs";
import {
  all as allFromReceipt,
  insert as insertReceipt,
  select as selectFromReceipt,
  selectBySectionAndArticle as selectBySectionAndArticleFromReceipt,
  selectGroupBy as selectGroupByFromReceipt,
} from "./query/Receipt.mjs";
import {
  all as allFromReceiver,
  insert as insertReceiver,
  select as selectFromReceiver,
  selectByKey as selectByKeyFromReceiver,
  update as updateReceiver,
} from "./query/Receiver.mjs";
import {
  all as allFromStore,
  insert as insertStore,
  select as selectFromStore,
  selectByKey as selectByKeyFromStore,
  update as updateStore,
} from "./query/Store.mjs";
import {
  all as allFromStoreSection,
  insert as insertStoreSection,
  select as selectFromStoreSection,
  selectByKey as selectByKeyFromStoreSection,
  update as updateStoreSection,
} from "./query/StoreSection.mjs";
import {
  countOfRowsForTables,
  selectMasterdataRowsEditedByInterval,
  selectPage,
} from "./Table.mjs";
import { TableArticle } from "./tables/Article.mjs";
import { TableAttribute } from "./tables/Attribute.mjs";
import { TableCostunit } from "./tables/Costunit.mjs";
import { TableEmission } from "./tables/Emission.mjs";
import { TableEmissionRequest } from "./tables/EmissionRequest.mjs";
import { TableHashtag } from "./tables/Hashtag.mjs";
import { TableImageContent } from "./tables/ImageContent.mjs";
import { TableImageReference } from "./tables/ImageReference.mjs";
import { TableManufacturer } from "./tables/Manufacturer.mjs";
import { TableReceipt } from "./tables/Receipt.mjs";
import { TableReceiptRequest } from "./tables/ReceiptRequest.mjs";
import { TableReceiver } from "./tables/Receiver.mjs";
import { TableStore } from "./tables/Store.mjs";
import { TableStoreSection } from "./tables/StoreSection.mjs";

export interface RunPartsResponse {
  // milliseconds of duration to run all parts
  duration: number;
  errors?: string[];
}

export const MasterdataTables = {
  [TableAttribute.id]: TableAttribute,
  [TableImageReference.id]: TableImageReference,
  [TableImageContent.id]: TableImageContent,
  [TableCostunit.id]: TableCostunit,
  [TableReceiver.id]: TableReceiver,
  [TableManufacturer.id]: TableManufacturer,
  [TableHashtag.id]: TableHashtag,
  [TableStore.id]: TableStore,
  [TableStoreSection.id]: TableStoreSection,
  [TableArticle.id]: TableArticle,
};

export const AllTables = [
  ...Object.values(MasterdataTables),
  TableReceipt,
  TableEmission,
  TableReceiptRequest,
  TableEmissionRequest,
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
  public version = "1.2.0";
  private setupPool: Pool | undefined;
  private databasePool: Pool | undefined;
  private tableStats: Record<
    string,
    { countOfRows?: number; lastChangeAt?: number }
  > = {};
  private tableRowsChangeConsumers: TableRowsChangeConsumer[] = [];
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

  public getTableStats = (tableId: string) => this.tableStats[tableId];

  public addTableRowsChangeConsumer = (consumer: TableRowsChangeConsumer) => {
    this.tableRowsChangeConsumers.push(consumer);
  };

  public removeTableRowsChangeConsumer = (
    consumer: TableRowsChangeConsumer
  ) => {
    this.tableRowsChangeConsumers = this.tableRowsChangeConsumers.filter(
      (c) => c !== consumer
    );
  };

  public changedTableStats = (
    tableId: string,
    updates: { countOfRows?: number; lastChangeAt?: number }
  ) => {
    const previousStats = this.tableStats[tableId] || {};
    this.tableStats[tableId] = { ...previousStats, ...updates };
    this.tableRowsChangeConsumers.forEach((consumer) =>
      consumer.onTableRowsChange([{ table: tableId }])
    );
  };

  public countOfRowsForTable = (tableId: string, countOfRows: number) => {
    const previousStats = this.tableStats[tableId] || {};
    this.tableStats[tableId] = { ...previousStats, countOfRows };
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
      const hashtag = await this.exportSingleTableData(this.tables.hashtag);
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
        hashtag,
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
    stats: {
      countOfRowsForTables: (...tables: Table[]) =>
        countOfRowsForTables(this, ...tables),
    },
    pagination: {
      selectPage: <T extends Partial<Record<string, unknown>>>(
        table: Table,
        page: number,
        pageSize: number
      ) => selectPage<T>(table, page, pageSize, this),
    },
    masterdata: {
      selectEditedAtFromTo: (
        source: keyof typeof MasterdataTables,
        filter: Filter_At_FromTo_Seconds
      ) =>
        selectMasterdataRowsEditedByInterval(
          this,
          MasterdataTables[source],
          filter
        ),
    },
    imageReference: {
      insert: (values: Row_ImageReference & PersistentRow) =>
        insertImageReference(values, this),
      update: (values: Row_ImageReference & PersistentRow) =>
        updateImageReference(values, this),
      updateImageReferences: (
        reference: string,
        previous: string | null,
        current: string | null
      ) => updateImageReferences(reference, previous, current, this),
      insertImageReferences: (reference: string, current: string | null) =>
        insertImageReferences(reference, current, this),
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
      selectLikeImageId: (filter: Filter_ImageId) =>
        selectFromImageContentLikeImageId(filter, this),
      all: () => allFromImageContent(this),
    },
    attribute: {
      insert: (values: Row_Attribute & PersistentRow) =>
        insertAttribute(values, this),
      update: (values: Row_Attribute & PersistentRow) =>
        updateAttribute(values, this),
      select: (filter: Filter_NameLike) => selectFromAttribute(filter, this),
      selectByKey: (attributeId: string) =>
        selectByKeyFromAttribute(attributeId, this),
      all: () => allFromAttribute(this),
    },
    store: {
      insert: (values: Row_Store & PersistentRow) => insertStore(values, this),
      update: (values: Row_Store & PersistentRow) => updateStore(values, this),
      select: (filter: Filter_NameLike) => selectFromStore(filter, this),
      selectByKey: (storeId: string) => selectByKeyFromStore(storeId, this),
      all: () => allFromStore(this),
    },
    storeSection: {
      insert: (values: Row_StoreSection & PersistentRow) =>
        insertStoreSection(values, this),
      update: (values: Row_StoreSection & PersistentRow) =>
        updateStoreSection(values, this),
      select: (filter: Filter_NameLike) => selectFromStoreSection(filter, this),
      selectByKey: (sectionId: string) =>
        selectByKeyFromStoreSection(sectionId, this),
      all: () => allFromStoreSection(this),
    },
    article: {
      insert: (values: Row_Article & PersistentRow) =>
        insertArticle(values, this),
      update: (values: Row_Article & PersistentRow) =>
        updateArticle(values, this),
      select: (filter: Filter_NameLike & Partial<Filter_Hashtag>) =>
        selectFromArticle(filter, this),
      selectByKey: (articleId: string) =>
        selectByKeyFromArticle(articleId, this),
      all: () => allFromArticle(this),
    },
    hashtag: {
      insert: (values: Row_Hashtag & PersistentRow) =>
        insertHashtag(values, this),
      update: (values: Row_Hashtag & PersistentRow) =>
        updateHashtag(values, this),
      select: (filter: Filter_NameLike) => selectFromHashtag(filter, this),
      selectByKey: (articleId: string) =>
        selectByKeyFromHashtag(articleId, this),
      all: () => allFromHashtag(this),
    },
    costunit: {
      insert: (values: Row_Costunit & PersistentRow) =>
        insertCostunit(values, this),
      update: (values: Row_Costunit & PersistentRow) =>
        updateCostunit(values, this),
      select: (filter: Filter_NameLike) => selectFromCostunit(filter, this),
      selectByKey: (articleId: string) =>
        selectByKeyFromCostunit(articleId, this),
      all: () => allFromCostunit(this),
    },
    receiver: {
      insert: (values: Row_Receiver & PersistentRow) =>
        insertReceiver(values, this),
      update: (values: Row_Receiver & PersistentRow) =>
        updateReceiver(values, this),
      select: (filter: Filter_NameLike) => selectFromReceiver(filter, this),
      selectByKey: (articleId: string) =>
        selectByKeyFromReceiver(articleId, this),
      all: () => allFromReceiver(this),
    },
    manufacturer: {
      insert: (values: Row_Manufacturer & PersistentRow) =>
        insertManufacturer(values, this),
      update: (values: Row_Manufacturer & PersistentRow) =>
        updateManufacturer(values, this),
      select: (filter: Filter_NameLike) => selectFromManufacturer(filter, this),
      selectByKey: (articleId: string) =>
        selectByKeyFromManufacturer(articleId, this),
      all: () => allFromManufacturer(this),
    },
    receipt: {
      insert: (values: Row_Receipt & PersistentRow) =>
        insertReceipt(values, this),
      select: (filter: Filter_At_FromTo_Seconds) =>
        selectFromReceipt(filter, this),
      selectBySectionAndArticle: (sectionId: string, articleId: string) =>
        selectBySectionAndArticleFromReceipt(sectionId, articleId, this),
      selectGroupBy: (
        filter: Filter_At_FromTo_Seconds,
        groupBy: Array<keyof Row_Receipt>,
        aggregate: Array<{ col: keyof Row_Receipt; fn: AggreagtionFunction }>
      ) => selectGroupByFromReceipt(filter, groupBy, aggregate, this),
      all: () => allFromReceipt(this),
    },
    emission: {
      insert: (values: Row_Emission & PersistentRow) =>
        insertEmission(values, this),
      select: (filter: Filter_At_FromTo_Seconds) =>
        selectFromEmission(filter, this),
      selectGroupBy: (
        filter: Filter_At_FromTo_Seconds,
        groupBy: Array<keyof Row_Emission>,
        aggregate: Array<{ col: keyof Row_Emission; fn: AggreagtionFunction }>
      ) => selectGroupByFromEmission(filter, groupBy, aggregate, this),
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
