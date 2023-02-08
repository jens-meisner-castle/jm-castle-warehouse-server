import { Table } from "jm-castle-warehouse-types";
import { masterdataTableColumns } from "./Masterdata.mjs";

export const TableManufacturer: Table = {
  id: "manufacturer",
  columns: [
    { name: "manufacturer_id", type: "varchar(100)" },
    { name: "name", type: "varchar(100)" },
    ...masterdataTableColumns(),
  ],
  primaryKey: "PRIMARY KEY(manufacturer_id)",
};
