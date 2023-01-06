import { Table } from "jm-castle-warehouse-types";
import { masterdataTableColumnsFragment } from "./Masterdata.mjs";

export const TableImageReference: Table = {
  id: "image_reference",
  columnsFragment:
    "image_id VARCHAR(100), reference VARCHAR(200)" +
    ", " +
    masterdataTableColumnsFragment() +
    ", " +
    "PRIMARY KEY(image_id, reference)",
};
