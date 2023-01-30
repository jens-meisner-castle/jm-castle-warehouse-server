import {
  InsertResponse,
  PersistentRow,
  Row_Costunit as Row,
  SelectResponse,
  SqlDataErrorCode,
  UpdateResponse,
} from "jm-castle-warehouse-types";
import { SqlError } from "mariadb";
import { without } from "../../../utils/Basic.mjs";
import { MariaDbClient } from "../MariaDb.mjs";
import { TableCostunit } from "../tables/Costunit.mjs";
import { Filter_NameLike, valuesClause } from "./QueryUtils.mjs";

const table = TableCostunit;

export const insert = async (
  values: Row & PersistentRow,
  client: MariaDbClient
): Promise<InsertResponse<Row>> => {
  try {
    const cmd = `INSERT INTO ${table.id} SET${valuesClause(values)}`;
    const response: any = await client.getDatabasePool().query(cmd);
    const { affectedRows } = response || {};
    return { result: { cmd, affectedRows, data: values } };
  } catch (error) {
    const { errno } = (error as SqlError) || {};
    return {
      error: error.toString(),
      errorCode: SqlDataErrorCode,
      errorDetails: { sqlErrorCode: errno },
    };
  }
};

export const update = async (
  values: Row & PersistentRow,
  client: MariaDbClient
): Promise<UpdateResponse<Row>> => {
  try {
    const { unit_id, dataset_version } = values;
    const valuesToUpdate = without({ ...values }, "unit_id");
    valuesToUpdate.dataset_version = dataset_version + 1;
    const cmd = `UPDATE ${table.id} SET${valuesClause(
      valuesToUpdate
    )} WHERE unit_id = '${unit_id}' AND dataset_version = ${dataset_version}`;
    const response: any = await client.getDatabasePool().query(cmd);
    const { affectedRows } = response || {};
    if (affectedRows === 1) {
      return {
        result: { cmd, affectedRows, data: { ...values, ...valuesToUpdate } },
      };
    } else {
      const { result, error } = await selectByKey(unit_id, client);
      const { rows } = result || {};
      if (rows && rows.length === 1) {
        const existingRow = rows[0];
        return {
          error: `The current dataset_version of costunit (${unit_id}) is ${existingRow.dataset_version}. You tried to update with dataset_version ${dataset_version}. Refresh your data first.`,
        };
      }
      if (rows && rows.length === 0) {
        return { error: `The costunit (${unit_id}) was not found.` };
      }
      if (error) {
        return {
          error: `Costunit (${unit_id}) was not updated. Received error when checking for reason: ${error}`,
        };
      }
      return {
        error: `Fatal error when updating costunit (${unit_id}). Costunit was not updated.`,
      };
    }
  } catch (error) {
    return { error: error.toString() };
  }
};

export const selectByKey = async (
  unitId: string,
  client: MariaDbClient
): Promise<SelectResponse<Row>> => {
  try {
    const cmd = `SELECT * FROM ${table.id} WHERE unit_id = '${unitId}'`;
    const queryResult = await client.getDatabasePool().query(cmd);
    const rows: Row[] = [];
    queryResult.forEach((r: Row) => rows.push(r));
    return { result: { cmd, rows } };
  } catch (error) {
    return { error: error.toString() };
  }
};

export const select = async (
  filter: Filter_NameLike,
  client: MariaDbClient
): Promise<SelectResponse<Row>> => {
  try {
    const { name } = filter;
    const cmd = `SELECT * FROM ${table.id} WHERE name LIKE '${name}'`;
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
