import { prisma } from '../../infrastructure/database/client.js';
import { GoalStatus, Priority } from '@prisma/client';

export class GoalsService {
    /**
     * Create a new goal.
     */
    async create(
        userId: string,
        title: string,
        description?: string,
        priority: Priority = Priority.MEDIUM,
        deadline?: Date
    ) {
        return prisma.goal.create({
            data: {
                userId,
                title,
                description,
                priority,
                deadline,
            },
        });
    }

    /**
     * List goals with optional status filter.
     */
    async list(userId: string, status?: GoalStatus) {
        return prisma.goal.findMany({
            where: {
                userId,
                ...(status && { status }),
            },
            include: {
                _count: { select: { tasks: true } },
            },
            orderBy: [
                { priority: 'asc' },
                { createdAt: 'desc' },
            ],
        });
    }

    /**
     * Update goal progress.
     */
    async updateProgress(userId: string, titleQuery: string, progress: number) {
        const goal = await prisma.goal.findFirst({
            where: {
                userId,
                title: { contains: titleQuery, mode: 'insensitive' },
                status: GoalStatus.ACTIVE,
            },
        });

        if (!goal) return null;

        const status = progress >= 100 ? GoalStatus.COMPLETED : GoalStatus.ACTIVE;

        return prisma.goal.update({
            where: { id: goal.id },
            data: { progress, status },
        });
    }

    /**
     * Get goal by partial title match.
     */
    async findByTitle(userId: string, titleQuery: string) {
        return prisma.goal.findFirst({
            where: {
                userId,
                title: { contains: titleQuery, mode: 'insensitive' },
            },
            include: {
                tasks: true,
            },
        });
    }

    /**
     * Get active goals summary for reports.
     */
    async getActiveGoalsSummary(userId: string) {
        const goals = await prisma.goal.findMany({
            where: { userId, status: GoalStatus.ACTIVE },
            select: { title: true, progress: true, priority: true, deadline: true },
            orderBy: { priority: 'asc' },
        });

        return goals;
    }
}

export const goalsService = new GoalsService();
