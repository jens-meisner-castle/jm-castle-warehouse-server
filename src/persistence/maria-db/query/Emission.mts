import { InsertResponse, SelectResponse } from "jm-castle-types";
import { PersistentRow, Row_Emission as Row } from "jm-castle-warehouse-types";
import { PoolConnection } from "mariadb";
import { without } from "../../../utils/Basic.mjs";
import {
  AggregationFunction,
  AggregationFunctions,
  StockdataInsertOptions,
} from "../../Types.mjs";
import { MariaDbClient } from "../MariaDb.mjs";
import { TableEmission } from "../tables/Emission.mjs";
import {
  Filter_At_FromTo_Seconds,
  selectLastInsertId,
  valuesClause,
} from "./QueryUtils.mjs";

const table = TableEmission;

export const insert = async (
  values: Row & PersistentRow,
  client: MariaDbClient,
  options?: StockdataInsertOptions
): Promise<InsertResponse<Row>> => {
  let connection: PoolConnection | undefined = undefined;
  try {
    const { noDatasetIdNeeded } = options || {};
    const cmd = `INSERT INTO ${table.id} SET${valuesClause(
      without(values, "dataset_id")
    )}`;
    // für LAST_INSERT_ID() muss die selbe connection verwendet werden
    connection = await client.getDatabasePool().getConnection();
    const response = await connection.query(cmd);
    const dataset_id = noDatasetIdNeeded
      ? "new"
      : await selectLastInsertId(connection);
    const { affectedRows } = response || {};
    return { result: { cmd, affectedRows, data: { ...values, dataset_id } } };
  } catch (error) {
    return { error: error.toString() };
  } finally {
    connection && connection.destroy();
  }
};

export const select = async (
  filter: Filter_At_FromTo_Seconds,
  client: MariaDbClient
): Promise<SelectResponse<Row>> => {
  try {
    const { at_from, at_to } = filter;
    const cmd = `SELECT * FROM ${table.id} WHERE emitted_at BETWEEN ${at_from} AND ${at_to}`;
    const queryResult = await client.getDatabasePool().query(cmd);
    const rows: Row[] = [];
    queryResult.forEach((r: Row) => rows.push(r));
    return { result: { cmd, rows } };
  } catch (error) {
    return { error: error.toString() };
  }
};

export const selectGroupBy = async (
  filter: Filter_At_FromTo_Seconds,
  groupBy: Array<keyof Row>,
  aggregate: Array<{ col: keyof Row; fn: AggregationFunction }>,
  client: MariaDbClient
): Promise<SelectResponse<Partial<Row>>> => {
  try {
    const { at_from, at_to } = filter;
    const cmd = `SELECT ${aggregate
      .map((e) => `${AggregationFunctions[e.fn].sql}(${e.col}) AS ${e.col}`)
      .join(", ")}, ${groupBy.join(", ")} FROM ${
      table.id
    } WHERE emitted_at BETWEEN ${at_from} AND ${at_to} GROUP BY ${groupBy.join(
      ", "
    )}`;
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
