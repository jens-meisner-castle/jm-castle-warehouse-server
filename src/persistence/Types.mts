import {
  InsertResponse,
  Row_Store,
  SelectResponse,
} from "jm-castle-warehouse-types";

import { Filter_StoreLike } from "./maria-db/query/QueryUtils.mjs";

export interface Persistence {
  type: () => string;
  tables: {
    store: {
      insert: (values: Row_Store) => Promise<InsertResponse>;
      select: (filter: Filter_StoreLike) => Promise<SelectResponse<Row_Store>>;
    };
  };
  disconnect: () => Promise<void>;
}
