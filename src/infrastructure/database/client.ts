import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

export async function connectDatabase(): Promise<void> {
    try {
        await prisma.$connect();
        console.log('✅ Database connected');
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    }
}

export async function disconnectDatabase(): Promise<void> {
    await prisma.$disconnect();
    console.log('📴 Database disconnected');
}
