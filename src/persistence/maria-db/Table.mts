import { SelectResponse, Table } from "jm-castle-types";
import {
  ColumnStatus,
  FindResponse,
  Row_Masterdata,
} from "jm-castle-warehouse-types";
import { MariaDbClient } from "./MariaDb.mjs";
import { Filter_At_FromTo_Seconds } from "./query/QueryUtils.mjs";

/**  [ {
    TABLE_CATALOG: 'def',
    TABLE_SCHEMA: 'castle_ac_dc',
    TABLE_NAME: 'datapoint_log',
    COLUMN_NAME: 'dataset_id',
    ORDINAL_POSITION: 1n,
    COLUMN_DEFAULT: null,
    IS_NULLABLE: 'NO',
    DATA_TYPE: 'bigint',
    CHARACTER_MAXIMUM_LENGTH: null,
    CHARACTER_OCTET_LENGTH: null,
    NUMERIC_PRECISION: 19n,
    NUMERIC_SCALE: 0n,
    DATETIME_PRECISION: null,
    CHARACTER_SET_NAME: null,
    COLLATION_NAME: null,
    COLUMN_TYPE: 'bigint(20)',
    COLUMN_KEY: 'PRI',
    EXTRA: 'auto_increment',
    PRIVILEGES: 'select,insert,update,references',
    COLUMN_COMMENT: '',
    IS_GENERATED: 'NEVER',
    GENERATION_EXPRESSION: null
  }, {...}] */
export const columns = async (
  table: Table,
  client: MariaDbClient
): Promise<
  { result: ColumnStatus[]; error?: never } | { error: string; result?: never }
> => {
  try {
    const response: any = await client
      .getSetupPool()
      .query(
        `SELECT COLUMN_NAME, COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='${client.getDatabaseName()}' AND TABLE_NAME='${
          table.id
        }'`
      );
    return {
      result: response.map((row: any) => ({
        name: row.COLUMN_NAME,
        type: row.COLUMN_TYPE,
      })),
    };
  } catch (error) {
    return { error: error.toString() };
  }
};

export const countOfRowsForTable = async (
  client: MariaDbClient,
  table: Table
): Promise<FindResponse<{ table: string; countOfRows: number }>> => {
  try {
    const cmd = `SELECT COUNT(*) as count_of_rows FROM ${table.id}`;
    const response: any = await client.getDatabasePool().query(cmd);
    let row: { count_of_rows: number | bigint } | undefined = undefined;
    response.forEach((r: { count_of_rows: number }) => (row = r));
    const dbCount = row ? row.count_of_rows : 0;
    const countOfRows =
      typeof dbCount === "bigint"
        ? Number.parseInt(dbCount.toString())
        : dbCount;

    return {
      result: {
        cmd,
        row: { table: table.id, countOfRows },
      },
    };
  } catch (error) {
    return { error: error.toString() };
  }
};

export const countOfRowsForTables = async (
  client: MariaDbClient,
  ...tables: Table[]
): Promise<
  FindResponse<{
    table: string;
    countOfRows: number;
    lastChangeAt: number | undefined;
  }>[]
> => {
  try {
    const counts: FindResponse<{ table: string; countOfRows: number }>[] =
      await Promise.all(
        tables.map((table) => {
          const { countOfRows } = client.getTableStats(table.id) || {};
          return typeof countOfRows === "number"
            ? Promise.resolve({
                result: {
                  cmd: "cached",
                  row: { countOfRows, table: table.id },
                },
              })
            : countOfRowsForTable(client, table);
        })
      );
    return counts.map((c) => {
      const { cmd, row } = c.result || {};
      const { table, countOfRows } = row || {};
      table &&
        typeof countOfRows === "number" &&
        client.countOfRowsForTable(table, countOfRows);
      const resultRow =
        table && typeof countOfRows === "number"
          ? {
              table: table,
              countOfRows: countOfRows,
              lastChangeAt: client.getTableStats(c.result.row.table)
                ?.lastChangeAt,
            }
          : undefined;
      return { result: { cmd, row: resultRow } };
    });
  } catch (error) {
    return [{ error: error.toString() }];
  }
};

export const columnsFragment = (table: Table) =>
  [
    ...table.columns.map(
      (col) =>
        `${col.name} ${col.type}${col.autoIncrement ? " AUTO_INCREMENT" : ""}`
    ),
    table.primaryKey,
  ].join(", ");

export const getPrimaryKeyColumns = (table: Table) => {
  const columnsPartStart = table.primaryKey.indexOf("(") + 1;
  const columns: string[] = [];
  const cols = table.primaryKey
    .slice(columnsPartStart, table.primaryKey.length - 1)
    .split(",");
  cols.forEach((c) => columns.push(c.trim()));
  return columns;
};

export const selectMasterdataRowsEditedByInterval = async (
  client: MariaDbClient,
  table: Table,
  filter: Filter_At_FromTo_Seconds
): Promise<SelectResponse<Row_Masterdata>> => {
  try {
    const { at_from, at_to } = filter;
    const cmd = `SELECT * FROM ${table.id} WHERE edited_at BETWEEN ${at_from} AND ${at_to} `;
    const response: any = await client.getDatabasePool().query(cmd);
    const rows: Row_Masterdata[] = [];
    response.forEach((r: Row_Masterdata) => rows.push(r));
    return { result: { cmd, rows } };
  } catch (error) {
    return { error: error.toString() };
  }
};

export const selectPage = async <T extends Partial<Record<string, unknown>>>(
  table: Table,
  page: number,
  pageSize: number,
  client: MariaDbClient
): Promise<SelectResponse<T>> => {
  try {
    const { preferredOrderBy } = table;
    const orderByClause = preferredOrderBy?.length
      ? `ORDER BY ${preferredOrderBy
          .map((ord) => `${ord.column} ${ord.direction}`)
          .join(", ")}`
      : `ORDER BY ${getPrimaryKeyColumns(table)
          .map((c) => `${c} ASC`)
          .join(", ")}`;
    const cmd = `SELECT * FROM ${
      table.id
    } ${orderByClause} LIMIT ${pageSize} OFFSET ${page * pageSize}`;
    const queryResult = await client.getDatabasePool().query(cmd);
    const rows: T[] = [];
    queryResult.forEach((r: T) => rows.push(r));
    return { result: { cmd, rows } };
  } catch (error) {
    return { error: error.toString() };
  }
};
