import { Table } from "jm-castle-warehouse-types";
import { masterdataTableColumnsFragment } from "./Masterdata.mjs";

export const TableStore: Table = {
  id: "store",
  columnsFragment:
    "store_id VARCHAR(100) PRIMARY KEY, name VARCHAR(100), image_refs VARCHAR(500)" +
    ", " +
    masterdataTableColumnsFragment(),
};
