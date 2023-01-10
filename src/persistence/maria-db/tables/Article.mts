import { Table } from "jm-castle-warehouse-types";
import { masterdataTableColumnsFragment } from "./Masterdata.mjs";

export const TableArticle: Table = {
  id: "article",
  columnsFragment:
    "article_id VARCHAR(100) PRIMARY KEY, name VARCHAR(100), image_refs VARCHAR(500), count_unit VARCHAR(100), hashtags VARCHAR(500), www_link VARCHAR(500)" +
    ", " +
    masterdataTableColumnsFragment(),
};
