import {
  InsertResponse,
  SelectResponse,
  UpdateResponse,
} from "jm-castle-types";
import {
  PersistentRow,
  Row_Attribute as Row,
  SqlDataErrorCode,
} from "jm-castle-warehouse-types";
import { DateTime } from "luxon";
import { SqlError } from "mariadb";
import { without } from "../../../utils/Basic.mjs";
import {
  MasterdataInsertOptions,
  MasterdataUpdateOptions,
} from "../../Types.mjs";
import { MariaDbClient } from "../MariaDb.mjs";
import { TableAttribute } from "../tables/Attribute.mjs";
import { Filter_NameLike, valuesClause } from "./QueryUtils.mjs";

const table = TableAttribute;

export const insert = async (
  values: Row & PersistentRow,
  client: MariaDbClient,
  options?: MasterdataInsertOptions
): Promise<InsertResponse<Row>> => {
  try {
    const { noTableStatsUpdate } = options || {};
    const cmd = `INSERT INTO ${table.id} SET${valuesClause(values)}`;
    const response: any = await client.getDatabasePool().query(cmd);
    const { affectedRows } = response || {};
    !noTableStatsUpdate &&
      client.changedTableStats("attribute", {
        countOfRows: undefined,
        lastChangeAt: DateTime.now().toSeconds(),
      });
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
  client: MariaDbClient,
  options?: MasterdataUpdateOptions
): Promise<UpdateResponse<Row>> => {
  try {
    const { attribute_id, dataset_version } = values;
    const valuesToUpdate = without({ ...values }, "attribute_id");
    const {
      noCheckDatasetVersion,
      noIncreaseDatasetVersion,
      noTableStatsUpdate,
    } = options || {};
    valuesToUpdate.dataset_version =
      dataset_version + (noIncreaseDatasetVersion ? 0 : 1);
    const cmd = noCheckDatasetVersion
      ? `UPDATE ${table.id} SET${valuesClause(
          valuesToUpdate
        )} WHERE attribute_id = '${attribute_id}'`
      : `UPDATE ${table.id} SET${valuesClause(
          valuesToUpdate
        )} WHERE attribute_id = '${attribute_id}' AND dataset_version = ${dataset_version}`;
    const response: any = await client.getDatabasePool().query(cmd);
    const { affectedRows } = response || {};
    if (affectedRows === 1) {
      !noTableStatsUpdate &&
        client.changedTableStats("attribute", {
          lastChangeAt: DateTime.now().toSeconds(),
        });
      return {
        result: { cmd, affectedRows, data: { ...values, ...valuesToUpdate } },
      };
    } else {
      const { result, error } = await selectByKey(attribute_id, client);
      const { rows } = result || {};
      if (rows && rows.length === 1) {
        const existingRow = rows[0];
        return {
          error: `The current dataset_version of attribute (${attribute_id}) is ${existingRow.dataset_version}. You tried to update with dataset_version ${dataset_version}. Refresh your data first.`,
        };
      }
      if (rows && rows.length === 0) {
        return { error: `The attribute (${attribute_id}) was not found.` };
      }
      if (error) {
        return {
          error: `Attribute (${attribute_id}) was not updated. Received error when checking for reason: ${error}`,
        };
      }
      return {
        error: `Fatal error when updating attribute (${attribute_id}). Attribute was not updated.`,
      };
    }
  } catch (error) {
    return { error: error.toString() };
  }
};

export const selectByKey = async (
  tagId: string,
  client: MariaDbClient
): Promise<SelectResponse<Row>> => {
  try {
    const cmd = `SELECT * FROM ${table.id} WHERE attribute_id = '${tagId}'`;
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
