import { Table } from "jm-castle-warehouse-types";

/**
 * Kostenstelle: zusätzliche Stammdaten
 */

export const TODO = {
  cost_unit: "???",
  image_refs: "vergleiche receipt",
};

export const TableEmission: Table = {
  id: "emission",
  columnsFragment: [
    "dataset_id INT AUTO_INCREMENT",
    "article_id VARCHAR(100)",
    "section_id VARCHAR(100)",
    "article_count SMALLINT",
    "emitted_at INT",
    "by_user VARCHAR(100)",
    "reason VARCHAR(100)",
    "receiver VARCHAR(100)",
    "PRIMARY KEY(dataset_id)",
  ].join(", "),
};
