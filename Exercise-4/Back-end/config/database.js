import { readFile } from "node:fs/promises";
import pg from "pg";
import { env } from "./env.js";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL
});

const schema = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");

export async function connectDatabase() {
  await pool.query("SELECT 1");
  await pool.query(schema);
  console.log("Connected to Neon PostgreSQL");
}

export async function closeDatabase() {
  await pool.end();
}

export function query(text, values) {
  return pool.query(text, values);
}

export async function withDatabaseTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
