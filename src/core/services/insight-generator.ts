import { prisma } from '../../infrastructure/database/client.js';
import { InsightPayload } from '../types/index.js';
import { patternDetector } from './pattern-detector.js';
import { correlationEngine } from './correlation-engine.js';

/**
 * Insight Generator — the final output layer of Fred's cognitive engine.
 * Combines patterns + correlations into actionable insights.
 */
export class InsightGenerator {
    /**
     * Generate and persist new insights for a user.
     */
    async generateInsights(userId: string) {
        const [patterns, correlations] = await Promise.all([
            patternDetector.detectAll(userId),
            correlationEngine.analyze(userId),
        ]);

        const allResults = [...patterns, ...correlations];
        const insights: InsightPayload[] = allResults.map(r => ({
            userId,
            type: r.type.toUpperCase() as InsightPayload['type'],
            title: r.title,
            content: r.description,
            modules: [r.module, ...r.relatedModules],
            confidence: r.confidence,
        }));

        // Persist insights
        if (insights.length > 0) {
            await prisma.insight.createMany({
                data: insights,
            });
        }

        return insights;
    }

    /**
     * Get unacknowledged insights for a user.
     */
    async getUnacknowledged(userId: string) {
        return prisma.insight.findMany({
            where: {
                userId,
                acknowledged: false,
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
        });
    }
}

export const insightGenerator = new InsightGenerator();
