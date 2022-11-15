import { MariaDatabaseSpec } from "jm-castle-warehouse-types";
import { MariaDbClient } from "./maria-db/MariaDb.mjs";
import { Persistence } from "./Types.mjs";

export const getPersistence = (
  persistenceId: string,
  spec: MariaDatabaseSpec
): Persistence => {
  return new MariaDbClient({ persistenceId, spec });
};
