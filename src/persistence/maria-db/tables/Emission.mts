import { Table } from "jm-castle-warehouse-types";

export const TableEmission: Table = {
  id: "emission",
  columnsFragment:
    "dataset_id INT PRIMARY KEY AUTO_INCREMENT, article_id VARCHAR(100), section_id VARCHAR(100), article_count SMALLINT, emitted_at INT, by_user VARCHAR(100)",
};
