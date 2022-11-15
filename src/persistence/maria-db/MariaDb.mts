import { MariaDatabaseSpec, Row_Store } from "jm-castle-warehouse-types";
import { createPool, Pool } from "mariadb";
import { Persistence } from "../Types.mjs";
import { Filter_StoreLike } from "./query/QueryUtils.mjs";
import {
  insert as insertStore,
  select as selectFromStore,
} from "./query/Store.mjs";
import { TableStore } from "./tables/Store.mjs";

export interface RunPartsResponse {
  // milliseconds of duration to run all parts
  duration: number;
  errors?: string[];
}

export const AllTables = [TableStore];

export interface MariaDbClientProps {
  persistenceId: string;
  spec: MariaDatabaseSpec;
}

export class MariaDbClient implements Persistence {
  constructor(props: MariaDbClientProps) {
    const { spec } = props;
    this.spec = spec;
    return this;
  }
  private setupPool: Pool | undefined;
  private databasePool: Pool | undefined;
  private spec: MariaDatabaseSpec;
  public type = () => "maria-db";
  public getDatabaseName = () => this.spec.database;
  public getDatabasePool = () => {
    if (!this.databasePool) {
      const { host, port, user, password, database } = this.spec;
      this.databasePool = createPool({
        host,
        port,
        user,
        password,
        database,
        connectionLimit: 10,
        decimalAsNumber: true,
      });
    }
    return this.databasePool;
  };
  public getSetupPool = () => {
    if (!this.setupPool) {
      const { host, port, user, password, database } = this.spec;
      this.setupPool = createPool({
        host,
        port,
        user,
        password,
        connectionLimit: 1,
      });
    }
    return this.setupPool;
  };
  public tables = {
    store: {
      insert: (values: Row_Store) => insertStore(values, this),
      select: (filter: Filter_StoreLike) => selectFromStore(filter, this),
    },
  };

  public disconnect = async () => {
    console.log(
      "Disconnecting from Maria Db would cause errors when building new pools..."
    );
    if (this.setupPool) {
      // cannot do this: await this.setupPool.end();
    }
    if (this.databasePool) {
      // cannot do this: await this.databasePool.end();
    }
  };
}
