import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

// Reuse one client across hot reloads in development. After `prisma generate` the client
// class is new, so a client made from the old class is dropped; otherwise the dev server
// would keep using a client that does not know about new tables or columns.
const cached: unknown = globalForPrisma.prisma;
const reusable = cached instanceof PrismaClient ? cached : undefined;
if (cached && !reusable) void (cached as { $disconnect(): Promise<void> }).$disconnect();

export const db = reusable ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
