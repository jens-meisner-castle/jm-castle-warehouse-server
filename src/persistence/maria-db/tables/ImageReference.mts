import { Table } from "jm-castle-warehouse-types";
import { masterdataTableColumnsFragment } from "./Masterdata.mjs";

export const TableImageReference: Table = {
  id: "image_reference",
  columnsFragment:
    "image_id VARCHAR(100) PRIMARY KEY, reference VARCHAR(100)" +
    ", " +
    masterdataTableColumnsFragment(),
};
