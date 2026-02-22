import { prisma } from '../../infrastructure/database/client.js';

export class EmotionService {
    /**
     * Log a mood entry.
     */
    async log(
        userId: string,
        mood: string,
        intensity: number,
        context?: string,
        triggers: string[] = []
    ) {
        return prisma.emotionLog.create({
            data: {
                userId,
                mood,
                intensity,
                context,
                triggers,
            },
        });
    }

    /**
     * Get mood trend over N days.
     */
    async getTrend(userId: string, days: number = 7) {
        const since = new Date();
        since.setDate(since.getDate() - days);

        const logs = await prisma.emotionLog.findMany({
            where: {
                userId,
                createdAt: { gte: since },
            },
            orderBy: { createdAt: 'asc' },
        });

        if (logs.length === 0) {
            return {
                entries: [],
                average: null,
                trend: 'unknown' as const,
                count: 0,
            };
        }

        const average = logs.reduce((sum, l) => sum + l.intensity, 0) / logs.length;

        // Determine trend by comparing first half to second half
        const mid = Math.floor(logs.length / 2);
        const firstHalf = logs.slice(0, mid || 1);
        const secondHalf = logs.slice(mid);

        const firstAvg = firstHalf.reduce((s, l) => s + l.intensity, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((s, l) => s + l.intensity, 0) / secondHalf.length;

        const diff = secondAvg - firstAvg;
        let trend: 'up' | 'down' | 'stable' | 'unknown';
        if (diff > 0.5) trend = 'up';
        else if (diff < -0.5) trend = 'down';
        else trend = 'stable';

        return {
            entries: logs.map(l => ({
                mood: l.mood,
                intensity: l.intensity,
                context: l.context,
                date: l.createdAt,
            })),
            average: Math.round(average * 10) / 10,
            trend,
            count: logs.length,
        };
    }

    /**
     * Get today's average mood for reports.
     */
    async getTodayMood(userId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const logs = await prisma.emotionLog.findMany({
            where: {
                userId,
                createdAt: { gte: today },
            },
        });

        if (logs.length === 0) return null;
        return Math.round(
            (logs.reduce((s, l) => s + l.intensity, 0) / logs.length) * 10
        ) / 10;
    }
}

export const emotionService = new EmotionService();
