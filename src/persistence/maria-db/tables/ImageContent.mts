import { Table } from "jm-castle-warehouse-types";
import { masterdataTableColumnsFragment } from "./Masterdata.mjs";

export const TableImageContent: Table = {
  id: "image_content",
  columnsFragment:
    "image_id VARCHAR(100) PRIMARY KEY, image_extension VARCHAR(50), size_in_bytes INT, width INT, height INT" +
    ", " +
    masterdataTableColumnsFragment(),
};
