import {
  InsertResponse,
  PersistentRow,
  Row_ImageContent as Row,
  SelectResponse,
  UpdateResponse,
} from "jm-castle-warehouse-types";
import { without } from "../../../utils/Basic.mjs";
import { MariaDbClient } from "../MariaDb.mjs";
import { TableImageContent } from "../tables/ImageContent.mjs";
import {
  Filter_ImageExtension,
  Filter_ImageId,
  isFilterImageExtension,
  valuesClause,
} from "./QueryUtils.mjs";

export { Row };

const table = TableImageContent;

export const insert = async (
  values: Row & PersistentRow,
  client: MariaDbClient
): Promise<UpdateResponse<Row>> => {
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
          error: `The current dataset_version of image content (${image_id}) is ${existingRow.dataset_version}. You tried to update with dataset_version ${dataset_version}. Refresh your data first.`,
        };
      }
      if (rows && rows.length === 0) {
        return { error: `The image content (${image_id}) was not found.` };
      }
      if (error) {
        return {
          error: `Image content (${image_id}) was not updated. Received error when checking for reason: ${error}`,
        };
      }
      return {
        error: `Fatal error when updating image content (${image_id}). Image content was not updated.`,
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

export const selectLikeImageId = async (
  filter: Filter_ImageId,
  client: MariaDbClient
): Promise<SelectResponse<Row>> => {
  try {
    const { image_id } = filter;
    const cmd = `SELECT * FROM ${table.id} WHERE image_id LIKE '${image_id}'`;
    const queryResult = await client.getDatabasePool().query(cmd);
    const rows: Row[] = [];
    queryResult.forEach((r: Row) => rows.push(r));
    return { result: { cmd, rows } };
  } catch (error) {
    return { error: error.toString() };
  }
};

export const selectByImageExtension = async (
  filter: Filter_ImageExtension,
  client: MariaDbClient
): Promise<SelectResponse<Row>> => {
  try {
    const { image_extension } = filter;
    const cmd = `SELECT * FROM ${table.id} WHERE image_extension = '${image_extension}'`;
    const queryResult = await client.getDatabasePool().query(cmd);
    const rows: Row[] = [];
    queryResult.forEach((r: Row) => rows.push(r));
    return { result: { cmd, rows } };
  } catch (error) {
    return { error: error.toString() };
  }
};

export const select = async (
  filter: Filter_ImageId | Filter_ImageExtension,
  client: MariaDbClient
): Promise<SelectResponse<Row>> => {
  try {
    const image_extension = isFilterImageExtension(filter)
      ? filter.image_extension
      : undefined;
    const image_id = !isFilterImageExtension(filter)
      ? filter.image_id
      : undefined;
    if (image_id) {
      return selectByKey({ image_id }, client);
    }
    if (image_extension) {
      return selectByImageExtension({ image_extension }, client);
    }
    return {
      error: `Select from image content needs image_id or image_extension. Both are undefined.`,
    };
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
