// Database connection and utilities
import { PrismaClient } from '@prisma/client';

// Singleton pattern for Prisma client
let prisma: PrismaClient;

export function getDatabase(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: ['error', 'warn'],
      // Uncomment for debugging:
      // log: ['query', 'error', 'warn'],
    });
  }
  return prisma;
}

export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
  }
}

// Helper to safely parse JSON fields
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

// Helper to stringify JSON fields
export function safeJsonStringify(data: unknown): string {
  try {
    return JSON.stringify(data);
  } catch {
    return '[]';
  }
}
