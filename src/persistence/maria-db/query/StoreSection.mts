import {
  FindResponse,
  InsertResponse,
  SelectResponse,
  UpdateResponse,
} from "jm-castle-types";
import {
  PersistentRow,
  Row_StoreSection as Row,
} from "jm-castle-warehouse-types";
import { DateTime } from "luxon";
import { without } from "../../../utils/Basic.mjs";
import { MariaDbClient } from "../MariaDb.mjs";
import { TableStoreSection } from "../tables/StoreSection.mjs";
import { Filter_NameLike, valuesClause } from "./QueryUtils.mjs";

const table = TableStoreSection;

export const insert = async (
  values: Row & PersistentRow,
  client: MariaDbClient
): Promise<InsertResponse<Row>> => {
  try {
    const cmd = `INSERT INTO ${table.id} SET${valuesClause(values)}`;
    const response: any = await client.getDatabasePool().query(cmd);
    const { affectedRows } = response || {};
    client.changedTableStats("store_section", {
      countOfRows: undefined,
      lastChangeAt: DateTime.now().toSeconds(),
    });
    return { result: { cmd, affectedRows, data: values } };
  } catch (error) {
    return { error: error.toString() };
  }
};

export const update = async (
  values: Row & PersistentRow,
  client: MariaDbClient
): Promise<UpdateResponse<Row>> => {
  try {
    const { section_id, dataset_version } = values;
    const valuesToUpdate = without({ ...values }, "section_id");
    valuesToUpdate.dataset_version = dataset_version + 1;
    const cmd = `UPDATE ${table.id} SET${valuesClause(
      valuesToUpdate
    )} WHERE section_id = '${section_id}' AND dataset_version = ${dataset_version}`;
    const response: any = await client.getDatabasePool().query(cmd);
    const { affectedRows } = response || {};
    if (affectedRows === 1) {
      client.changedTableStats("store_section", {
        lastChangeAt: DateTime.now().toSeconds(),
      });
      return {
        result: { cmd, affectedRows, data: { ...values, ...valuesToUpdate } },
      };
    } else {
      const { result, error } = await selectByKey(section_id, client);
      const { row: existingRow } = result || {};
      if (existingRow) {
        return {
          error: `The current dataset_version of section (${section_id}) is ${existingRow.dataset_version}. You tried to update with dataset_version ${dataset_version}. Refresh your data first.`,
        };
      }
      if (!existingRow) {
        return { error: `The section (${section_id}) was not found.` };
      }
      if (error) {
        return {
          error: `Section (${section_id}) was not updated. Received error when checking for reason: ${error}`,
        };
      }
      return {
        error: `Fatal error when updating section (${section_id}). Section was not updated.`,
      };
    }
  } catch (error) {
    return { error: error.toString() };
  }
};

export const selectByKey = async (
  sectionId: string,
  client: MariaDbClient
): Promise<FindResponse<Row>> => {
  try {
    const cmd = `SELECT * FROM ${table.id} WHERE section_id = '${sectionId}'`;
    const queryResult = await client.getDatabasePool().query(cmd);
    let row: Row | undefined = undefined;
    queryResult.forEach((r: Row) => (row = r));
    return { result: { cmd, row } };
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
