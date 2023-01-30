import { Table } from "jm-castle-warehouse-types";
import { masterdataTableColumns } from "./Masterdata.mjs";

export const TableImageReference: Table = {
  id: "image_reference",
  columns: [
    { name: "image_id", type: "varchar(100)" },
    { name: "reference", type: "varchar(200)" },
    ...masterdataTableColumns(),
  ],
  primaryKey: "PRIMARY KEY(image_id, reference)",
};
