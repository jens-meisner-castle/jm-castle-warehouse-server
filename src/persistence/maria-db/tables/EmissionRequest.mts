import { Table } from "jm-castle-warehouse-types";

export const TableEmissionRequest: Table = {
  id: "emission_request",
  columns: [
    { name: "dataset_id", type: "int(11)", autoIncrement: true },
    { name: "article_id", type: "varchar(100)" },
    { name: "section_id", type: "varchar(100)" },
    { name: "article_count", type: "smallint(6)" },
    { name: "requested_at", type: "int(11)" },
    { name: "by_user", type: "varchar(100)" },
    { name: "reason", type: "varchar(100)" },
    { name: "receiver", type: "varchar(100)" },
  ],
  primaryKey: "PRIMARY KEY(dataset_id)",
};
