import { prisma } from '../../infrastructure/database/client.js';
import { TaskStatus, Priority } from '@prisma/client';

export class TasksService {
    /**
     * Add a new task, optionally linked to a goal.
     */
    async add(
        userId: string,
        title: string,
        priority: Priority = Priority.MEDIUM,
        dueDate?: Date,
        goalId?: string
    ) {
        return prisma.task.create({
            data: {
                userId,
                title,
                priority,
                dueDate,
                goalId,
            },
        });
    }

    /**
     * List tasks with optional status filter.
     */
    async list(userId: string, status?: TaskStatus) {
        return prisma.task.findMany({
            where: {
                userId,
                ...(status && { status }),
            },
            include: {
                goal: { select: { title: true } },
            },
            orderBy: [
                { priority: 'asc' },
                { dueDate: 'asc' },
                { createdAt: 'desc' },
            ],
        });
    }

    /**
     * Mark a task as done by partial title match.
     */
    async markDone(userId: string, titleQuery: string) {
        const task = await prisma.task.findFirst({
            where: {
                userId,
                title: { contains: titleQuery, mode: 'insensitive' },
                status: { not: TaskStatus.DONE },
            },
        });

        if (!task) return null;

        return prisma.task.update({
            where: { id: task.id },
            data: {
                status: TaskStatus.DONE,
                completedAt: new Date(),
            },
        });
    }

    /**
     * Get pending tasks count for reports.
     */
    async getPendingCount(userId: string): Promise<number> {
        return prisma.task.count({
            where: {
                userId,
                status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] },
            },
        });
    }

    /**
     * Get tasks completed today.
     */
    async getCompletedToday(userId: string): Promise<number> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return prisma.task.count({
            where: {
                userId,
                status: TaskStatus.DONE,
                completedAt: { gte: today },
            },
        });
    }

    /**
     * Get tasks completed this week.
     */
    async getCompletedThisWeek(userId: string): Promise<number> {
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);

        return prisma.task.count({
            where: {
                userId,
                status: TaskStatus.DONE,
                completedAt: { gte: weekStart },
            },
        });
    }

    /**
     * Find a goal by partial title match (for linking tasks).
     */
    async findGoalByTitle(userId: string, titleQuery: string) {
        return prisma.goal.findFirst({
            where: {
                userId,
                title: { contains: titleQuery, mode: 'insensitive' },
            },
            select: { id: true, title: true },
        });
    }
}

export const tasksService = new TasksService();
