import {
  InsertResponse,
  PersistentRow,
  Row_ImageReference as Row,
  SelectResponse,
} from "jm-castle-warehouse-types";
import { without } from "../../../utils/Basic.mjs";
import { MariaDbClient } from "../MariaDb.mjs";
import { TableImageReference } from "../tables/ImageReference.mjs";
import {
  Filter_ImageId,
  Filter_Reference,
  valuesClause,
} from "./QueryUtils.mjs";

export { Row };

const table = TableImageReference;

export const insert = async (
  values: Row & PersistentRow,
  client: MariaDbClient
): Promise<InsertResponse<Row>> => {
  try {
    const cmd = `INSERT INTO ${table.id} SET${valuesClause(values)}`;
    const response = await client.getDatabasePool().query(cmd);
    const { affectedRows } = response || {};
    return { result: { cmd, affectedRows, data: values } };
  } catch (error) {
    return { error: error.toString() };
  }
};

export const update = async (
  values: Row & PersistentRow,
  client: MariaDbClient
): Promise<InsertResponse<Row>> => {
  try {
    const { image_id, dataset_version } = values;
    const valuesToUpdate = without({ ...values }, "image_id");
    valuesToUpdate.dataset_version = dataset_version + 1;
    const cmd = `UPDATE ${table.id} SET${valuesClause(
      valuesToUpdate
    )} WHERE image_id = '${image_id}' AND dataset_version = ${dataset_version}`;
    const response: any = await client.getDatabasePool().query(cmd);
    const { affectedRows } = response || {};
    if (affectedRows === 1) {
      return {
        result: { cmd, affectedRows, data: { ...values, ...valuesToUpdate } },
      };
    } else {
      const { result, error } = await selectByKey({ image_id }, client);
      const { rows } = result || {};
      if (rows && rows.length === 1) {
        const existingRow = rows[0];
        return {
          error: `The current dataset_version of image reference (${image_id}) is ${existingRow.dataset_version}. You tried to update with dataset_version ${dataset_version}. Refresh your data first.`,
        };
      }
      if (rows && rows.length === 0) {
        return { error: `The image reference (${image_id}) was not found.` };
      }
      if (error) {
        return {
          error: `Image reference (${image_id}) was not updated. Received error when checking for reason: ${error}`,
        };
      }
      return {
        error: `Fatal error when updating image reference (${image_id}). Image reference was not updated.`,
      };
    }
  } catch (error) {
    return { error: error.toString() };
  }
};

export const selectByKey = async (
  filter: Filter_ImageId,
  client: MariaDbClient
): Promise<SelectResponse<Row>> => {
  try {
    const { image_id } = filter;
    const cmd = `SELECT * FROM ${table.id} WHERE image_id = '${image_id}'`;
    const queryResult = await client.getDatabasePool().query(cmd);
    const rows: Row[] = [];
    queryResult.forEach((r: Row) => rows.push(r));
    return { result: { cmd, rows } };
  } catch (error) {
    return { error: error.toString() };
  }
};

export const selectByReference = async (
  filter: Filter_Reference,
  client: MariaDbClient
): Promise<SelectResponse<Row>> => {
  try {
    const { reference } = filter;
    const cmd = `SELECT * FROM ${table.id} WHERE reference = '${reference}'`;
    const queryResult = await client.getDatabasePool().query(cmd);
    const rows: Row[] = [];
    queryResult.forEach((r: Row) => rows.push(r));
    return { result: { cmd, rows } };
  } catch (error) {
    return { error: error.toString() };
  }
};

export const select = async (
  filter: Filter_ImageId | Filter_Reference,
  client: MariaDbClient
): Promise<SelectResponse<Row>> => {
  try {
    const { image_id, reference } = filter || {};
    if (image_id) {
      return selectByKey({ image_id }, client);
    }
    if (reference) {
      return selectByReference({ reference }, client);
    }
    return {
      error: `Select from image reference needs image_id or reference. Both are undefined.`,
    };
  } catch (error) {
    return { error: error.toString() };
  }
};