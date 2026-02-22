import { prisma } from '../../infrastructure/database/client.js';
import { AnalysisResult, ModuleName } from '../types/index.js';

/**
 * Pattern Detector — scans module data for behavioral patterns.
 * This is the foundation of Fred's intelligence.
 * 
 * Future: integrate ML models, NLP, or LLM for deeper analysis.
 * MVP: simple rule-based detection.
 */
export class PatternDetector {
    /**
     * Detect patterns in task completion behavior.
     */
    async detectTaskPatterns(userId: string): Promise<AnalysisResult[]> {
        const results: AnalysisResult[] = [];

        // Check for overdue tasks pattern
        const overdueTasks = await prisma.task.count({
            where: {
                userId,
                status: { in: ['PENDING', 'IN_PROGRESS'] },
                dueDate: { lt: new Date() },
            },
        });

        if (overdueTasks > 3) {
            results.push({
                module: ModuleName.TASKS,
                type: 'alert',
                title: 'Acúmulo de Tarefas Atrasadas',
                description: `Você tem ${overdueTasks} tarefas atrasadas. Considere repriorizar ou delegar.`,
                confidence: 0.8,
                relatedModules: [ModuleName.TASKS, ModuleName.GOALS],
                data: { overdueCount: overdueTasks },
            });
        }

        return results;
    }

    /**
     * Detect patterns in emotional logs.
     */
    async detectEmotionPatterns(userId: string): Promise<AnalysisResult[]> {
        const results: AnalysisResult[] = [];

        // Check for sustained low mood
        const recentLogs = await prisma.emotionLog.findMany({
            where: {
                userId,
                createdAt: {
                    gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // last 3 days
                },
            },
        });

        if (recentLogs.length >= 3) {
            const avgIntensity = recentLogs.reduce((s, l) => s + l.intensity, 0) / recentLogs.length;
            if (avgIntensity <= 3) {
                results.push({
                    module: ModuleName.EMOTION,
                    type: 'alert',
                    title: 'Humor Baixo Persistente',
                    description: `Sua média de humor nos últimos 3 dias é ${avgIntensity.toFixed(1)}/10. Cuide-se.`,
                    confidence: 0.7,
                    relatedModules: [ModuleName.EMOTION],
                    data: { avgIntensity, logCount: recentLogs.length },
                });
            }
        }

        return results;
    }

    /**
     * Run all pattern detections.
     */
    async detectAll(userId: string): Promise<AnalysisResult[]> {
        const [taskPatterns, emotionPatterns] = await Promise.all([
            this.detectTaskPatterns(userId),
            this.detectEmotionPatterns(userId),
        ]);

        return [...taskPatterns, ...emotionPatterns];
    }
}

export const patternDetector = new PatternDetector();
