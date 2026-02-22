import { prisma } from '../../infrastructure/database/client.js';
import { MemoryType } from '@prisma/client';

export class MemoryService {
    /**
     * Store a new memory.
     */
    async remember(
        userId: string,
        content: string,
        type: MemoryType = MemoryType.NOTE,
        tags: string[] = [],
        context?: string
    ) {
        return prisma.memory.create({
            data: {
                userId,
                content,
                type,
                context,
                tags,
            },
        });
    }

    /**
     * Search memories by content or type.
     */
    async recall(userId: string, query?: string, type?: MemoryType, limit = 10) {
        return prisma.memory.findMany({
            where: {
                userId,
                ...(type && { type }),
                ...(query && {
                    content: {
                        contains: query,
                        mode: 'insensitive' as const,
                    },
                }),
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    /**
     * Get memory statistics.
     */
    async stats(userId: string) {
        const counts = await prisma.memory.groupBy({
            by: ['type'],
            where: { userId },
            _count: true,
        });

        const total = counts.reduce((sum, c) => sum + c._count, 0);
        return { total, byType: counts };
    }
}

export const memoryService = new MemoryService();
