import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = `${process.env.DATABASE_URL}`;
const connectionStringDev = `${process.env.DATABASE_URL_DEV}`;
const isDevEnvironment = process.env.NODE_ENV === 'development';

const pool = new Pool({
  connectionString: isDevEnvironment ? connectionStringDev : connectionString,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);


const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient({
  adapter,
  log: isDevEnvironment ? ['error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
