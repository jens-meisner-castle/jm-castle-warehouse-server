import { Table } from "jm-castle-warehouse-types";

export const TableReceipt: Table = {
  id: "receipt",
  columnsFragment:
    "dataset_id INT PRIMARY KEY AUTO_INCREMENT, article_id VARCHAR(100), section_id VARCHAR(100), article_count SMALLINT, receipt_at INT, by_user VARCHAR(100), www_link VARCHAR(500), guaranty_to INT, image_refs VARCHAR(500)",
};
