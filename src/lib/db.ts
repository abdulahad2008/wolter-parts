import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "./env";
import * as schema from "./schema";

type DB = NodePgDatabase<typeof schema>;

// Keep one pool per process (dev hot reload would otherwise open new ones).
const globalForDb = globalThis as unknown as { __wpPool?: Pool; __wpDb?: DB };

function createDb(): DB {
  if (!env.databaseUrl) throw new Error("DATABASE_URL is not set");
  const pool = globalForDb.__wpPool ?? new Pool({ connectionString: env.databaseUrl, max: 10 });
  globalForDb.__wpPool = pool;
  return drizzle(pool, { schema });
}

export function getDb(): DB {
  if (!globalForDb.__wpDb) globalForDb.__wpDb = createDb();
  return globalForDb.__wpDb;
}

export { schema };
