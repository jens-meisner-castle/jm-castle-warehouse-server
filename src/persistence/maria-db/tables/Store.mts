import { Table } from "jm-castle-warehouse-types";
import { masterdataTableColumns } from "./Masterdata.mjs";

export const TableStore: Table = {
  id: "store",
  columns: [
    { name: "store_id", type: "varchar(100)" },
    { name: "name", type: "varchar(100)" },
    { name: "image_refs", type: "varchar(500)" },
    ...masterdataTableColumns(),
  ],
  primaryKey: "PRIMARY KEY(store_id)",
};
