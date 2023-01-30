import { Table } from "jm-castle-warehouse-types";
import { masterdataTableColumns } from "./Masterdata.mjs";

export const TableCostunit: Table = {
  id: "costunit",
  columns: [
    { name: "unit_id", type: "varchar(100)" },
    { name: "name", type: "varchar(100)" },
    ...masterdataTableColumns(),
  ],
  primaryKey: "PRIMARY KEY(unit_id)",
};
