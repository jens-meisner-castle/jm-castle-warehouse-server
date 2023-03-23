import {
  InsertResponse,
  SelectResponse,
  UpdateResponse,
} from "jm-castle-types";
import {
  PersistentRow,
  Row_ImageContent as Row,
} from "jm-castle-warehouse-types";
import { DateTime } from "luxon";
import { without } from "../../../utils/Basic.mjs";
import {
  MasterdataInsertOptions,
  MasterdataUpdateOptions,
} from "../../Types.mjs";
import { MariaDbClient } from "../MariaDb.mjs";
import { TableImageContent } from "../tables/ImageContent.mjs";
import {
  Filter_ImageExtension,
  Filter_ImageId,
  isFilterImageExtension,
  valuesClause,
} from "./QueryUtils.mjs";

const table = TableImageContent;

export const insert = async (
  values: Row & PersistentRow,
  client: MariaDbClient,
  options?: MasterdataInsertOptions
): Promise<UpdateResponse<Row>> => {
  try {
    const { noTableStatsUpdate } = options || {};
    const cmd = `INSERT INTO ${table.id} SET${valuesClause(values)}`;
    const response = await client.getDatabasePool().query(cmd);
    const { affectedRows } = response || {};
    !noTableStatsUpdate &&
      client.changedTableStats("image_content", {
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
  client: MariaDbClient,
  options?: MasterdataUpdateOptions
): Promise<InsertResponse<Row>> => {
  try {
    const { image_id, dataset_version } = values;
    const valuesToUpdate = without({ ...values }, "image_id");
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
        )} WHERE image_id = '${image_id}'`
      : `UPDATE ${table.id} SET${valuesClause(
          valuesToUpdate
        )} WHERE image_id = '${image_id}' AND dataset_version = ${dataset_version}`;
    const response: any = await client.getDatabasePool().query(cmd);
    const { affectedRows } = response || {};
    if (affectedRows === 1) {
      !noTableStatsUpdate &&
        client.changedTableStats("image_content", {
          lastChangeAt: DateTime.now().toSeconds(),
        });
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
