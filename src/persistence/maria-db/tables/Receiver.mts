import { Table } from "jm-castle-warehouse-types";
import { masterdataTableColumnsFragment } from "./Masterdata.mjs";

export const TableReceiver: Table = {
  id: "receiver",
  columnsFragment: [
    "receiver_id VARCHAR(100)",
    "name VARCHAR(100)",
    "mail_address VARCHAR(100)",
    masterdataTableColumnsFragment(),
    "PRIMARY KEY(receiver_id)",
  ].join(", "),
};
