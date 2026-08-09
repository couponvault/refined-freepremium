import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

// Cache in all environments to avoid re-creating connections on Vercel serverless
globalForPrisma.prisma = db;
