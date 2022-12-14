import {
  InsertResponse,
  PersistentRow,
  Row_Receipt as Row,
  SelectResponse,
} from "jm-castle-warehouse-types";
import { without } from "../../../utils/Basic.mjs";
import { MariaDbClient } from "../MariaDb.mjs";
import { TableReceipt } from "../tables/Receipt.mjs";
import { Filter_At_FromTo_Seconds, valuesClause } from "./QueryUtils.mjs";
import { selectLastInsertId } from "./QueryUtils.mjs";

const table = TableReceipt;

export const insert = async (
  values: Row & PersistentRow,
  client: MariaDbClient
): Promise<InsertResponse<Row>> => {
  try {
    const cmd = `INSERT INTO ${table.id} SET${valuesClause(
      without(values, "dataset_id")
    )}`;
    // für LAST_INSERT_ID() muss die selbe connection verwendet werden
    const connection = await client.getDatabasePool().getConnection();
    const response = await connection.query(cmd);
    const dataset_id = await selectLastInsertId(connection);
    const { affectedRows } = response || {};
    return { result: { cmd, affectedRows, data: { ...values, dataset_id } } };
  } catch (error) {
    return { error: error.toString() };
  }
};

export const select = async (
  filter: Filter_At_FromTo_Seconds,
  client: MariaDbClient
): Promise<SelectResponse<Row>> => {
  try {
    const { at_from, at_to } = filter;
    const cmd = `SELECT * FROM ${table.id} WHERE receipt_at BETWEEN ${at_from} AND ${at_to}`;
    const queryResult = await client.getDatabasePool().query(cmd);
    const rows: Row[] = [];
    queryResult.forEach((r: Row) => rows.push(r));
    return { result: { cmd, rows } };
  } catch (error) {
    return { error: error.toString() };
  }
};

export const all = async (
  client: MariaDbClient
): Promise<SelectResponse<Row>> => {
  try {
    const cmd = `SELECT * FROM ${table.id}`;
    const queryResult = await client.getDatabasePool().query(cmd);
    const rows: Row[] = [];
    queryResult.forEach((r: Row) => rows.push(r));
    return { result: { cmd, rows } };
  } catch (error) {
    return { error: error.toString() };
  }
};
