import { Table } from "jm-castle-warehouse-types";
import { masterdataTableColumns } from "./Masterdata.mjs";

export const TableHashtag: Table = {
  id: "hashtag",
  columns: [
    { name: "tag_id", type: "varchar(100)" },
    { name: "name", type: "varchar(100)" },
    ...masterdataTableColumns(),
  ],
  primaryKey: "PRIMARY KEY(tag_id)",
};
