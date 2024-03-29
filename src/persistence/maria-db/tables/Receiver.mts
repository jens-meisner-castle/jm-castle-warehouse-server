import { Table } from "jm-castle-warehouse-types";
import { masterdataTableColumns } from "./Masterdata.mjs";

export const TableReceiver: Table = {
  id: "receiver",
  columns: [
    { name: "receiver_id", type: "varchar(100)" },
    { name: "name", type: "varchar(100)" },
    { name: "mail_address", type: "varchar(100)" },
    ...masterdataTableColumns(),
  ],
  primaryKey: "PRIMARY KEY(receiver_id)",
};
