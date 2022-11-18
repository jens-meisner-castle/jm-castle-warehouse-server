import { Table } from "jm-castle-warehouse-types";
import { masterdataTableColumnsFragment } from "./Masterdata.mjs";

export const TableStoreSection: Table = {
  id: "store_section",
  columnsFragment:
    "section_id VARCHAR(100) PRIMARY KEY, store_id VARCHAR(100), name VARCHAR(100)" +
    ", " +
    masterdataTableColumnsFragment(),
};
