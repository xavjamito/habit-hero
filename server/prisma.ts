import { PrismaClient } from '@prisma/client';

// Create a global instance of PrismaClient to be reused across requests
const prisma = new PrismaClient();

export default prisma;