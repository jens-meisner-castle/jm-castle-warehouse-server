import { Table, TableStatus } from "jm-castle-types";
import { SystemSetupStatus } from "jm-castle-types";
import {
  AllTables,
  MariaDbClient,
} from "../../persistence/maria-db/MariaDb.mjs";
import { columns } from "../../persistence/maria-db/Table.mjs";
import { Persistence } from "../../persistence/Types.mjs";

export const getSystemSetupStatus = async (
  persistence: Persistence
): Promise<SystemSetupStatus> => {
  if (persistence.type() !== "maria-db") {
    throw new Error(
      "Currently is a setup for a MariaDB only. The default persistence is different."
    );
  }
  const mariaClient = persistence as unknown as MariaDbClient;
  const allTables: Table[] = [...AllTables];
  const allColumns = await Promise.all(
    allTables.map((table) => columns(table, mariaClient))
  );
  const tables: Record<string, TableStatus> = {};
  const targetTables: Record<string, TableStatus> = {};

  allTables.forEach((table, i) => {
    (targetTables[table.id] = {
      name: table.id,
      table: table,
      isCreated: true,
      columns: table.columns,
    }),
      (tables[table.id] = {
        name: table.id,
        table: table,
        isCreated: !!allColumns[i]?.result?.length,
        columns: allColumns[i]?.result || [],
      });
  });
  const database = { name: mariaClient.getDatabaseName(), tables };
  const software = { name: "castle-warehouse", tables: targetTables };
  return { database, software };
};
