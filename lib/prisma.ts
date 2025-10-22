// src/lib/prisma.ts
import { PrismaClient, Prisma } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// ✅ ADD: Export DatabaseError
export class DatabaseError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message)
    this.name = 'DatabaseError'
    if (originalError) {
      this.stack = originalError.stack
    }
  }
}

// ✅ ADD: Export transaction wrapper
export async function withTransaction<T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(callback)
}

// ✅ ADD: Export Prisma types
export type { Prisma }