import { Table } from "jm-castle-warehouse-types";

export const TableEmission: Table = {
  id: "emission",
  primaryKey: "PRIMARY KEY(dataset_id)",
  columns: [
    { name: "dataset_id", type: "int(11)", autoIncrement: true },
    { name: "article_id", type: "varchar(100)" },
    { name: "section_id", type: "varchar(100)" },
    { name: "article_count", type: "smallint(6)" },
    { name: "emitted_at", type: "int(11)" },
    { name: "by_user", type: "varchar(100)" },
    { name: "reason", type: "varchar(100)" },
    { name: "receiver", type: "varchar(100)" },
    { name: "image_refs", type: "varchar(500)" },
    { name: "cost_unit", type: "varchar(100)" },
    { name: "price", type: "int(11)" },
  ],
};
