import {
  InsertResponse,
  Row_Article,
  Row_Emission,
  Row_Receipt,
  Row_Store,
  Row_StoreSection,
  SelectResponse,
  UpdateResponse,
} from "jm-castle-warehouse-types";

import {
  Filter_At_FromTo_Seconds,
  Filter_NameLike,
} from "./maria-db/query/QueryUtils.mjs";

export interface Persistence {
  type: () => string;
  tables: {
    store: {
      insert: (values: Row_Store) => Promise<InsertResponse<Row_Store>>;
      update: (values: Row_Store) => Promise<UpdateResponse<Row_Store>>;
      select: (filter: Filter_NameLike) => Promise<SelectResponse<Row_Store>>;
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
    };
    article: {
      insert: (values: Row_Article) => Promise<InsertResponse<Row_Article>>;
      update: (values: Row_Article) => Promise<UpdateResponse<Row_Article>>;
      select: (filter: Filter_NameLike) => Promise<SelectResponse<Row_Article>>;
    };
    receipt: {
      insert: (values: Row_Receipt) => Promise<InsertResponse<Row_Receipt>>;
      select: (
        filter: Filter_At_FromTo_Seconds
      ) => Promise<SelectResponse<Row_Receipt>>;
    };
    emission: {
      insert: (values: Row_Emission) => Promise<InsertResponse<Row_Emission>>;
      select: (
        filter: Filter_At_FromTo_Seconds
      ) => Promise<SelectResponse<Row_Emission>>;
    };
  };
  disconnect: () => Promise<void>;
}
