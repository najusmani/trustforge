import "server-only";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Database connection.
 * - DATABASE_URL set: real Postgres (production, or local if you point it at one).
 * - Not set, outside production: an embedded Postgres (PGlite) stored in ./.data/pglite,
 *   so the site runs on this PC with no database server. `npm run dev` creates its tables.
 */

type Db = ReturnType<typeof drizzlePostgres<typeof schema>>;

function createDb(): Db {
  const url = process.env.DATABASE_URL;
  if (url) {
    return drizzlePostgres(postgres(url, { prepare: false, max: 5 }), { schema });
  }
  if (process.env.NODE_ENV === "production") {
    // Don't crash the build or the public pages: postgres-js connects lazily, so only pages
    // that query the database (sign-in, workspace) fail until DATABASE_URL is set.
    console.error("[db] DATABASE_URL is not set; sign-in and the workspace will not work.");
    return drizzlePostgres(postgres("postgres://not-configured@127.0.0.1:1/none", { max: 1 }), { schema });
  }
  const client = new PGlite("./.data/pglite");
  // Same query API as postgres-js; the cast keeps one Db type for the rest of the code.
  return drizzlePglite(client, { schema }) as unknown as Db;
}

const globalForDb = globalThis as unknown as { __tfDb?: Db };

export const db: Db = globalForDb.__tfDb ?? createDb();
if (process.env.NODE_ENV !== "production") globalForDb.__tfDb = db;

export { schema };
