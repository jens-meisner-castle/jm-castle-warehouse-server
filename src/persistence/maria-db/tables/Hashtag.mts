import { Table } from "jm-castle-warehouse-types";
import { masterdataTableColumnsFragment } from "./Masterdata.mjs";

export const TableHashtag: Table = {
  id: "hashtag",
  columnsFragment:
    "tag_id VARCHAR(100) PRIMARY KEY, name VARCHAR(100)" +
    ", " +
    masterdataTableColumnsFragment(),
};
