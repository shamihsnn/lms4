import dotenv from "dotenv";
// Load environment variables first
dotenv.config();

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

// Environment variables for Supabase connection
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL or SUPABASE_DATABASE_URL environment variable is required");
}

console.log("Attempting to connect to database:", databaseUrl.replace(/:[^:]*@/, ':****@'));

// Create postgres connection with improved settings
const client = postgres(databaseUrl, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 60,
  ssl: { rejectUnauthorized: false },
  transform: {
    undefined: null,
  },
  onnotice: () => {}, // Suppress notices
});

// Create drizzle instance
export const db = drizzle(client, { schema });

// Export types
export type Database = typeof db;
