import {
  DbExportData,
  ErrorCode,
  InsertResponse,
  Row_Article,
  Row_Emission,
  Row_ImageContent,
  Row_ImageReference,
  Row_Receipt,
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
      all: () => Promise<SelectResponse<Row_ImageContent>>;
    };
    store: {
      insert: (values: Row_Store) => Promise<InsertResponse<Row_Store>>;
      update: (values: Row_Store) => Promise<UpdateResponse<Row_Store>>;
      select: (filter: Filter_NameLike) => Promise<SelectResponse<Row_Store>>;
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
      all: () => Promise<SelectResponse<Row_StoreSection>>;
    };
    article: {
      insert: (values: Row_Article) => Promise<InsertResponse<Row_Article>>;
      update: (values: Row_Article) => Promise<UpdateResponse<Row_Article>>;
      select: (filter: Filter_NameLike) => Promise<SelectResponse<Row_Article>>;
      all: () => Promise<SelectResponse<Row_Article>>;
    };
    receipt: {
      insert: (values: Row_Receipt) => Promise<InsertResponse<Row_Receipt>>;
      select: (
        filter: Filter_At_FromTo_Seconds
      ) => Promise<SelectResponse<Row_Receipt>>;
      all: () => Promise<SelectResponse<Row_Receipt>>;
    };
    emission: {
      insert: (values: Row_Emission) => Promise<InsertResponse<Row_Emission>>;
      select: (
        filter: Filter_At_FromTo_Seconds
      ) => Promise<SelectResponse<Row_Emission>>;
      all: () => Promise<SelectResponse<Row_Emission>>;
    };
  };
  disconnect: () => Promise<void>;
}
