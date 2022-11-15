import { Table } from "jm-castle-warehouse-types";

export const TableStore: Table = {
  id: "store",
  columnsFragment: "store_id VARCHAR(100) PRIMARY KEY, name VARCHAR(100)",
};
