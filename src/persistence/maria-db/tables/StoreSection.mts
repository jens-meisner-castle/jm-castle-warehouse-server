import { Table } from "jm-castle-warehouse-types";
import { masterdataTableColumns } from "./Masterdata.mjs";

export const TableStoreSection: Table = {
  id: "store_section",
  columns: [
    { name: "section_id", type: "varchar(100)" },
    { name: "store_id", type: "varchar(100)" },
    { name: "name", type: "varchar(100)" },
    { name: "short_id", type: "varchar(3)" },
    { name: "image_refs", type: "varchar(500)" },
    ...masterdataTableColumns(),
  ],
  primaryKey: "PRIMARY KEY(section_id)",
};
