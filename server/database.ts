import dotenv from "dotenv";
// Load environment variables first
dotenv.config();

import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@shared/schema";
import path from "path";
import fs from "fs";

// Local SQLite file path
const dbFile = path.resolve(process.cwd(), "data", "labdesk.db");

// Ensure data directory exists
const dataDir = path.dirname(dbFile);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

console.log("Using local SQLite database:", dbFile);

// Initialize SQLite connection
const sqlite = new Database(dbFile);
// Improve concurrency for desktop usage
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("synchronous = NORMAL");

// Create drizzle instance
export const db = drizzle(sqlite, { schema });

// Export types
export type Database = typeof db;
