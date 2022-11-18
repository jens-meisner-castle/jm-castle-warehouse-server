import { Table } from "jm-castle-warehouse-types";

export const TableReceipt: Table = {
  id: "receipt",
  columnsFragment:
    "dataset_id INT PRIMARY KEY AUTO_INCREMENT, article_id VARCHAR(100), section_id VARCHAR(100), article_count SMALLINT, at_seconds INT, by_user VARCHAR(100)",
};
