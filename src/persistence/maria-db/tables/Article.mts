import { Table } from "jm-castle-warehouse-types";
import { masterdataTableColumnsFragment } from "./Masterdata.mjs";

export const TableArticle: Table = {
  id: "article",
  columnsFragment:
    "article_id VARCHAR(100) PRIMARY KEY, name VARCHAR(100), count_unit VARCHAR(100)" +
    ", " +
    masterdataTableColumnsFragment(),
};
