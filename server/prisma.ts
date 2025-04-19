import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

try {
  // Create a global instance of PrismaClient to be reused across requests
  prisma = new PrismaClient({
    // Enable logging in development environment
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
  
  // Test connection
  console.log('Initializing Prisma client...');
} catch (error) {
  console.error('Failed to initialize Prisma client:', error);
  // Create a placeholder PrismaClient that will throw errors on operation
  // This allows the application to start even if Prisma fails to initialize
  prisma = new PrismaClient();
}

export default prisma;