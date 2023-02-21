import {
  ColumnStatus,
  FindResponse,
  Row_Masterdata,
  SelectResponse,
  Table,
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
): Promise<FindResponse<{ table: string; countOfRows: number }>[]> => {
  try {
    return await Promise.all(
      tables.map((table) => countOfRowsForTable(client, table))
    );
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
