import {
  FindResponse,
  InsertResponse,
  SelectResponse,
  UpdateResponse,
} from "jm-castle-types";
import {
  PersistentRow,
  Row_Article as Row,
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
import { TableArticle } from "../tables/Article.mjs";
import {
  Filter_Hashtag,
  Filter_NameLike,
  valuesClause,
} from "./QueryUtils.mjs";

const table = TableArticle;

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
      client.changedTableStats("article", {
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
    const { article_id, dataset_version } = values;
    const valuesToUpdate = without({ ...values }, "article_id");
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
        )} WHERE article_id = '${article_id}'`
      : `UPDATE ${table.id} SET${valuesClause(
          valuesToUpdate
        )} WHERE article_id = '${article_id}' AND dataset_version = ${dataset_version}`;
    const response: any = await client.getDatabasePool().query(cmd);
    const { affectedRows } = response || {};
    if (affectedRows === 1) {
      !noTableStatsUpdate &&
        client.changedTableStats("article", {
          lastChangeAt: DateTime.now().toSeconds(),
        });
      return {
        result: { cmd, affectedRows, data: { ...values, ...valuesToUpdate } },
      };
    } else {
      const { result, error } = await selectByKey(article_id, client);
      const { row: existingRow } = result || {};
      if (existingRow) {
        return {
          error: `The current dataset_version of article (${article_id}) is ${existingRow.dataset_version}. You tried to update with dataset_version ${dataset_version}. Refresh your data first.`,
        };
      }
      if (!existingRow) {
        return { error: `The article (${article_id}) was not found.` };
      }
      if (error) {
        return {
          error: `Article (${article_id}) was not updated. Received error when checking for reason: ${error}`,
        };
      }
      return {
        error: `Fatal error when updating article (${article_id}). Article was not updated.`,
      };
    }
  } catch (error) {
    return { error: error.toString() };
  }
};

export const selectByKey = async (
  articleId: string,
  client: MariaDbClient
): Promise<FindResponse<Row>> => {
  try {
    const cmd = `SELECT * FROM ${table.id} WHERE article_id = '${articleId}'`;
    const queryResult = await client.getDatabasePool().query(cmd);
    let row: Row | undefined = undefined;
    queryResult.forEach((r: Row) => (row = r));
    return { result: { cmd, row } };
  } catch (error) {
    return { error: error.toString() };
  }
};

export const select = async (
  filter: Partial<Filter_NameLike> & Partial<Filter_Hashtag>,
  client: MariaDbClient
): Promise<SelectResponse<Row>> => {
  try {
    const { name, hashtag } = filter;
    const hashtagClause = hashtag
      ? hashtag.map((s) => `hashtags LIKE '%"${s}"%'`).join(" OR ")
      : undefined;
    const nameClause = name ? `name LIKE ${name}` : undefined;
    const cmd =
      hashtagClause && nameClause
        ? `SELECT * FROM ${table.id} WHERE name LIKE '${name}' AND (${hashtagClause})`
        : hashtagClause
        ? `SELECT * FROM ${table.id} WHERE (${hashtagClause})`
        : nameClause
        ? `SELECT * FROM ${table.id} WHERE name LIKE '${name}'`
        : `SELECT * FROM ${table.id}`;
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
