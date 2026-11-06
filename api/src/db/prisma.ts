import { PrismaClient } from '@prisma/client';

/** Single shared client: it manages its own connection pool, so create it once per process. */
export const prisma = new PrismaClient();
