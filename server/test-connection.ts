import dotenv from "dotenv";
// Load environment variables first
dotenv.config();

import { db } from "./database";
import { adminUsers } from "@shared/schema";

async function testConnection() {
  try {
    console.log("Testing Supabase database connection...");
    
    // Try to query the admin users table
    const users = await db.select().from(adminUsers).limit(1);
    
    console.log("✅ Database connection successful!");
    console.log(`Found ${users.length} admin user(s)`);
    
    if (users.length > 0) {
      console.log(`Default admin username: ${users[0].username}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Database connection failed:");
    console.error(error);
    process.exit(1);
  }
}

testConnection();
