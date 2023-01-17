import { Table } from "jm-castle-warehouse-types";

export const TableEmissionRequest: Table = {
  id: "emission_request",
  columnsFragment: [
    "dataset_id INT AUTO_INCREMENT",
    "article_id VARCHAR(100)",
    "section_id VARCHAR(100)",
    "article_count SMALLINT",
    "requested_at INT",
    "by_user VARCHAR(100)",
    "reason VARCHAR(100)",
    "receiver VARCHAR(100)",
    "PRIMARY KEY(dataset_id)",
  ].join(", "),
};
