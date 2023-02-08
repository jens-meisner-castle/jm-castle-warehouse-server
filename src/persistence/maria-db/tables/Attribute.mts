import { Table } from "jm-castle-warehouse-types";
import { masterdataTableColumns } from "./Masterdata.mjs";

export const TableAttribute: Table = {
  id: "attribute",
  primaryKey: "PRIMARY KEY(attribute_id)",
  columns: [
    { name: "attribute_id", type: "varchar(100)" },
    { name: "name", type: "varchar(100)" },
    { name: "value_type", type: "varchar(100)" },
    { name: "value_unit", type: "varchar(100)" },
    ...masterdataTableColumns(),
  ],
};
