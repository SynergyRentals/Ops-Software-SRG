import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema, logger: false });

// Add connection health check
pool.on('error', (err) => {
  console.error('Database connection error:', err);
  // Attempt to reconnect
  setTimeout(() => {
    pool.connect().catch(console.error);
  }, 5000);
});