import { Table } from "jm-castle-warehouse-types";
import { masterdataTableColumns } from "./Masterdata.mjs";

export const TableImageContent: Table = {
  id: "image_content",
  columns: [
    { name: "image_id", type: "varchar(100)" },
    { name: "image_extension", type: "varchar(50)" },
    { name: "size_in_bytes", type: "int(11)" },
    { name: "width", type: "int(11)" },
    { name: "height", type: "int(11)" },
    ...masterdataTableColumns(),
  ],
  primaryKey: "PRIMARY KEY(image_id)",
};
