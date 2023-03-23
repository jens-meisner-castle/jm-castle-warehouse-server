import {
  BatchResponse,
  FindResponse,
  InsertResponse,
  SelectResponse,
  Table,
  UpdateResponse,
} from "jm-castle-types";
import {
  DbExportData,
  DbImportData,
  ErrorCode,
  Row_Article,
  Row_Attribute,
  Row_Costunit,
  Row_Emission,
  Row_Hashtag,
  Row_ImageContent,
  Row_ImageReference,
  Row_Manufacturer,
  Row_Masterdata,
  Row_Receipt,
  Row_Receiver,
  Row_Store,
  Row_StoreSection,
} from "jm-castle-warehouse-types";
import { MasterdataTables } from "./maria-db/MariaDb.mjs";

import {
  Filter_At_FromTo_Seconds,
  Filter_Hashtag,
  Filter_ImageExtension,
  Filter_ImageId,
  Filter_NameLike,
  Filter_Reference,
} from "./maria-db/query/QueryUtils.mjs";

export const AggregationFunctions = {
  min: { sql: "MIN" },
  max: { sql: "MAX" },
  sum: { sql: "SUM" },
};

export interface TableRowsChangeConsumer {
  onTableRowsChange: (changes: { table: string }[]) => void;
}

export interface MasterdataUpdateOptions {
  noCheckDatasetVersion?: boolean;
  noIncreaseDatasetVersion?: boolean;
  noTableStatsUpdate?: boolean;
}

export interface MasterdataInsertOptions {
  noTableStatsUpdate?: boolean;
}

export interface StockdataInsertOptions {
  noDatasetIdNeeded?: boolean;
}

export type AggregationFunction = keyof typeof AggregationFunctions;
export interface Persistence {
  type: () => string;
  version: string;
  exportTableData: () => Promise<
    | { tables: DbExportData["tables"]; error?: never; errorCode?: never }
    | { tables?: never; error: string; errorCode: ErrorCode }
  >;
  importTableData: (
    tables: DbExportData["tables"]
  ) => Promise<
    | (DbImportData & { error?: never; errorCode?: never })
    | { error: string; errorCode: ErrorCode; tables?: never }
  >;
  addTableRowsChangeConsumer: (consumer: TableRowsChangeConsumer) => void;
  removeTableRowsChangeConsumer: (consumer: TableRowsChangeConsumer) => void;
  tables: {
    stats: {
      countOfRowsForTables: (...tables: Table[]) => Promise<
        FindResponse<{
          table: string;
          countOfRows: number;
          lastChangeAt: number | undefined;
        }>[]
      >;
    };
    pagination: {
      selectPage: <T extends Partial<Row_Masterdata>>(
        table: Table,
        page: number,
        pageSize: number
      ) => Promise<SelectResponse<T>>;
    };
    masterdata: {
      selectEditedAtFromTo: (
        source: keyof typeof MasterdataTables,
        filter: Filter_At_FromTo_Seconds
      ) => Promise<SelectResponse<Row_Masterdata>>;
    };
    imageReference: {
      insert: (
        values: Row_ImageReference,
        options?: MasterdataInsertOptions
      ) => Promise<InsertResponse<Row_ImageReference>>;
      update: (
        values: Row_ImageReference,
        options?: MasterdataUpdateOptions
      ) => Promise<UpdateResponse<Row_ImageReference>>;
      updateImageReferences: (
        reference: string,
        previous: string | null,
        current: string | null
      ) => Promise<BatchResponse>;
      insertImageReferences: (
        reference: string,
        current: string | null
      ) => Promise<BatchResponse>;
      select: (
        filter: Filter_ImageId | Filter_Reference
      ) => Promise<SelectResponse<Row_ImageReference>>;
      all: () => Promise<SelectResponse<Row_ImageReference>>;
    };
    imageContent: {
      insert: (
        values: Row_ImageContent,
        options?: MasterdataInsertOptions
      ) => Promise<InsertResponse<Row_ImageContent>>;
      update: (
        values: Row_ImageContent,
        options?: MasterdataUpdateOptions
      ) => Promise<UpdateResponse<Row_ImageContent>>;
      select: (
        filter: Filter_ImageId | Filter_ImageExtension
      ) => Promise<SelectResponse<Row_ImageContent>>;
      selectLikeImageId: (
        filter: Filter_ImageId
      ) => Promise<SelectResponse<Row_ImageContent>>;
      all: () => Promise<SelectResponse<Row_ImageContent>>;
    };
    store: {
      insert: (
        values: Row_Store,
        options?: MasterdataInsertOptions
      ) => Promise<InsertResponse<Row_Store>>;
      update: (
        values: Row_Store,
        options?: MasterdataUpdateOptions
      ) => Promise<UpdateResponse<Row_Store>>;
      select: (filter: Filter_NameLike) => Promise<SelectResponse<Row_Store>>;
      selectByKey: (storeId: string) => Promise<SelectResponse<Row_Store>>;
      all: () => Promise<SelectResponse<Row_Store>>;
    };
    storeSection: {
      insert: (
        values: Row_StoreSection,
        options?: MasterdataInsertOptions
      ) => Promise<InsertResponse<Row_StoreSection>>;
      update: (
        values: Row_StoreSection,
        options?: MasterdataUpdateOptions
      ) => Promise<UpdateResponse<Row_StoreSection>>;
      select: (
        filter: Filter_NameLike
      ) => Promise<SelectResponse<Row_StoreSection>>;
      selectByKey: (
        sectionId: string
      ) => Promise<FindResponse<Row_StoreSection>>;
      all: () => Promise<SelectResponse<Row_StoreSection>>;
    };
    attribute: {
      insert: (
        values: Row_Attribute,
        options?: MasterdataInsertOptions
      ) => Promise<InsertResponse<Row_Attribute>>;
      update: (
        values: Row_Attribute,
        options?: MasterdataUpdateOptions
      ) => Promise<UpdateResponse<Row_Attribute>>;
      select: (
        filter: Filter_NameLike
      ) => Promise<SelectResponse<Row_Attribute>>;
      selectByKey: (storeId: string) => Promise<SelectResponse<Row_Attribute>>;
      all: () => Promise<SelectResponse<Row_Attribute>>;
    };
    hashtag: {
      insert: (
        values: Row_Hashtag,
        options?: MasterdataInsertOptions
      ) => Promise<InsertResponse<Row_Hashtag>>;
      update: (
        values: Row_Hashtag,
        options?: MasterdataUpdateOptions
      ) => Promise<UpdateResponse<Row_Hashtag>>;
      select: (filter: Filter_NameLike) => Promise<SelectResponse<Row_Hashtag>>;
      selectByKey: (tagId: string) => Promise<SelectResponse<Row_Hashtag>>;
      all: () => Promise<SelectResponse<Row_Hashtag>>;
    };
    costunit: {
      insert: (
        values: Row_Costunit,
        options?: MasterdataInsertOptions
      ) => Promise<InsertResponse<Row_Costunit>>;
      update: (
        values: Row_Costunit,
        options?: MasterdataUpdateOptions
      ) => Promise<UpdateResponse<Row_Costunit>>;
      select: (
        filter: Filter_NameLike
      ) => Promise<SelectResponse<Row_Costunit>>;
      selectByKey: (tagId: string) => Promise<SelectResponse<Row_Costunit>>;
      all: () => Promise<SelectResponse<Row_Costunit>>;
    };
    receiver: {
      insert: (
        values: Row_Receiver,
        options?: MasterdataInsertOptions
      ) => Promise<InsertResponse<Row_Receiver>>;
      update: (
        values: Row_Receiver,
        options?: MasterdataUpdateOptions
      ) => Promise<UpdateResponse<Row_Receiver>>;
      select: (
        filter: Filter_NameLike
      ) => Promise<SelectResponse<Row_Receiver>>;
      selectByKey: (
        receiverId: string
      ) => Promise<SelectResponse<Row_Receiver>>;
      all: () => Promise<SelectResponse<Row_Receiver>>;
    };
    manufacturer: {
      insert: (
        values: Row_Manufacturer,
        options?: MasterdataInsertOptions
      ) => Promise<InsertResponse<Row_Manufacturer>>;
      update: (
        values: Row_Manufacturer,
        options?: MasterdataUpdateOptions
      ) => Promise<UpdateResponse<Row_Manufacturer>>;
      select: (
        filter: Filter_NameLike
      ) => Promise<SelectResponse<Row_Manufacturer>>;
      selectByKey: (
        manufacturerId: string
      ) => Promise<SelectResponse<Row_Manufacturer>>;
      all: () => Promise<SelectResponse<Row_Manufacturer>>;
    };
    article: {
      insert: (
        values: Row_Article,
        options?: MasterdataInsertOptions
      ) => Promise<InsertResponse<Row_Article>>;
      update: (
        values: Row_Article,
        options?: MasterdataUpdateOptions
      ) => Promise<UpdateResponse<Row_Article>>;
      select: (
        filter: Filter_NameLike & Partial<Filter_Hashtag>
      ) => Promise<SelectResponse<Row_Article>>;
      selectByKey: (articleId: string) => Promise<FindResponse<Row_Article>>;
      all: () => Promise<SelectResponse<Row_Article>>;
    };
    receipt: {
      insert: (
        values: Row_Receipt,
        options?: StockdataInsertOptions
      ) => Promise<InsertResponse<Row_Receipt>>;
      select: (
        filter: Filter_At_FromTo_Seconds
      ) => Promise<SelectResponse<Row_Receipt>>;
      selectBySectionAndArticle: (
        sectionId: string,
        articleId: string
      ) => Promise<SelectResponse<Row_Receipt>>;
      selectGroupBy: (
        filter: Filter_At_FromTo_Seconds,
        groupBy: Array<keyof Row_Receipt>,
        aggregate: Array<{ col: keyof Row_Receipt; fn: AggregationFunction }>
      ) => Promise<SelectResponse<Partial<Row_Receipt>>>;
      all: () => Promise<SelectResponse<Row_Receipt>>;
    };
    emission: {
      insert: (
        values: Row_Emission,
        options?: StockdataInsertOptions
      ) => Promise<InsertResponse<Row_Emission>>;
      select: (
        filter: Filter_At_FromTo_Seconds
      ) => Promise<SelectResponse<Row_Emission>>;
      selectGroupBy: (
        filter: Filter_At_FromTo_Seconds,
        groupBy: Array<keyof Row_Emission>,
        aggregate: Array<{ col: keyof Row_Emission; fn: AggregationFunction }>
      ) => Promise<SelectResponse<Partial<Row_Emission>>>;
      all: () => Promise<SelectResponse<Row_Emission>>;
    };
  };
  disconnect: () => Promise<void>;
}
