// Applies the SQL migrations in ./drizzle.
// - DATABASE_URL set: migrates that Postgres database (run on deploy).
// - Not set and not production: migrates the local PGlite database in ./.data/pglite.
// - Not set in production (e.g. a preview build without a database): skips with a warning.

const url = process.env.DATABASE_URL;

if (url) {
  const { default: postgres } = await import("postgres");
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const { migrate } = await import("drizzle-orm/postgres-js/migrator");
  const client = postgres(url, { max: 1, prepare: false });
  await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  await client.end();
  console.log("[migrate] database is up to date");
} else if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
  console.warn("[migrate] DATABASE_URL is not set; skipped. Sign-in will not work until it is set.");
} else {
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const { mkdirSync } = await import("node:fs");
  mkdirSync("./.data", { recursive: true });
  const client = new PGlite("./.data/pglite");
  await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  await client.close();
  console.log("[migrate] local database (.data/pglite) is up to date");
}
