import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

// Parse DATABASE_URL for explicit config (pg pool needs this)
const dbUrl = process.env.DATABASE_URL || "";
const poolConfig = dbUrl ? { connectionString: dbUrl } : {
  host: "localhost",
  port: 5432,
  database: "shreehr",
  user: "shreehr",
  password: "shreehr_local",
};

// Create a connection pool
const pool = globalForPrisma.pool ?? new Pool(poolConfig);

// Create the Prisma adapter
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;
}
