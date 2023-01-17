import {
  BatchResponse,
  DbExportData,
  ErrorCode,
  InsertResponse,
  Row_Article,
  Row_Emission,
  Row_Hashtag,
  Row_ImageContent,
  Row_ImageReference,
  Row_Receipt,
  Row_Receiver,
  Row_Store,
  Row_StoreSection,
  SelectResponse,
  UpdateResponse,
} from "jm-castle-warehouse-types";

import {
  Filter_At_FromTo_Seconds,
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

export type AggreagtionFunction = keyof typeof AggregationFunctions;
export interface Persistence {
  type: () => string;
  version: string;
  exportTableData: () => Promise<
    | { tables: DbExportData["tables"]; error?: never; errorCode?: never }
    | { tables?: never; error: string; errorCode: ErrorCode }
  >;
  tables: {
    imageReference: {
      insert: (
        values: Row_ImageReference
      ) => Promise<InsertResponse<Row_ImageReference>>;
      update: (
        values: Row_ImageReference
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
        values: Row_ImageContent
      ) => Promise<InsertResponse<Row_ImageContent>>;
      update: (
        values: Row_ImageContent
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
      insert: (values: Row_Store) => Promise<InsertResponse<Row_Store>>;
      update: (values: Row_Store) => Promise<UpdateResponse<Row_Store>>;
      select: (filter: Filter_NameLike) => Promise<SelectResponse<Row_Store>>;
      selectByKey: (storeId: string) => Promise<SelectResponse<Row_Store>>;
      all: () => Promise<SelectResponse<Row_Store>>;
    };
    storeSection: {
      insert: (
        values: Row_StoreSection
      ) => Promise<InsertResponse<Row_StoreSection>>;
      update: (
        values: Row_StoreSection
      ) => Promise<UpdateResponse<Row_StoreSection>>;
      select: (
        filter: Filter_NameLike
      ) => Promise<SelectResponse<Row_StoreSection>>;
      selectByKey: (
        sectionId: string
      ) => Promise<SelectResponse<Row_StoreSection>>;
      all: () => Promise<SelectResponse<Row_StoreSection>>;
    };
    hashtag: {
      insert: (values: Row_Hashtag) => Promise<InsertResponse<Row_Hashtag>>;
      update: (values: Row_Hashtag) => Promise<UpdateResponse<Row_Hashtag>>;
      select: (filter: Filter_NameLike) => Promise<SelectResponse<Row_Hashtag>>;
      selectByKey: (tagId: string) => Promise<SelectResponse<Row_Hashtag>>;
      all: () => Promise<SelectResponse<Row_Hashtag>>;
    };
    receiver: {
      insert: (values: Row_Receiver) => Promise<InsertResponse<Row_Receiver>>;
      update: (values: Row_Receiver) => Promise<UpdateResponse<Row_Receiver>>;
      select: (
        filter: Filter_NameLike
      ) => Promise<SelectResponse<Row_Receiver>>;
      selectByKey: (
        receiverId: string
      ) => Promise<SelectResponse<Row_Receiver>>;
      all: () => Promise<SelectResponse<Row_Receiver>>;
    };
    article: {
      insert: (values: Row_Article) => Promise<InsertResponse<Row_Article>>;
      update: (values: Row_Article) => Promise<UpdateResponse<Row_Article>>;
      select: (filter: Filter_NameLike) => Promise<SelectResponse<Row_Article>>;
      selectByKey: (articleId: string) => Promise<SelectResponse<Row_Article>>;
      all: () => Promise<SelectResponse<Row_Article>>;
    };
    receipt: {
      insert: (values: Row_Receipt) => Promise<InsertResponse<Row_Receipt>>;
      select: (
        filter: Filter_At_FromTo_Seconds
      ) => Promise<SelectResponse<Row_Receipt>>;
      selectGroupBy: (
        filter: Filter_At_FromTo_Seconds,
        groupBy: Array<keyof Row_Receipt>,
        aggregate: Array<{ col: keyof Row_Receipt; fn: AggreagtionFunction }>
      ) => Promise<SelectResponse<Partial<Row_Receipt>>>;
      all: () => Promise<SelectResponse<Row_Receipt>>;
    };
    emission: {
      insert: (values: Row_Emission) => Promise<InsertResponse<Row_Emission>>;
      select: (
        filter: Filter_At_FromTo_Seconds
      ) => Promise<SelectResponse<Row_Emission>>;
      selectGroupBy: (
        filter: Filter_At_FromTo_Seconds,
        groupBy: Array<keyof Row_Emission>,
        aggregate: Array<{ col: keyof Row_Emission; fn: AggreagtionFunction }>
      ) => Promise<SelectResponse<Partial<Row_Emission>>>;
      all: () => Promise<SelectResponse<Row_Emission>>;
    };
  };
  disconnect: () => Promise<void>;
}
