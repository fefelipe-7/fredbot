// ─── Core Types for Fred's Cognitive Engine ──────────────

export enum Priority {
    CRITICAL = 'CRITICAL',
    HIGH = 'HIGH',
    MEDIUM = 'MEDIUM',
    LOW = 'LOW',
}

export enum ModuleName {
    MEMORY = 'memory',
    GOALS = 'goals',
    TASKS = 'tasks',
    EMOTION = 'emotion',
    FINANCE = 'finance',
    CORE = 'core',
}

export interface ModuleContext {
    module: ModuleName;
    userId: string;
    channelId: string;
    guildId: string;
}

export interface AnalysisResult {
    module: ModuleName;
    type: 'pattern' | 'correlation' | 'alert' | 'suggestion';
    title: string;
    description: string;
    confidence: number; // 0-1
    relatedModules: ModuleName[];
    data: Record<string, unknown>;
}

export interface InsightPayload {
    userId: string;
    type: 'PATTERN' | 'CORRELATION' | 'ALERT' | 'SUGGESTION';
    title: string;
    content: string;
    modules: string[];
    confidence: number;
}

export interface DailyReportData {
    pendingTasks: number;
    completedToday: number;
    activeGoals: number;
    goalProgress: { title: string; progress: number }[];
    moodAverage: number | null;
    moodTrend: 'up' | 'down' | 'stable' | 'unknown';
    insights: { title: string; content: string }[];
}

export interface WeeklyReviewData extends DailyReportData {
    tasksCompletedThisWeek: number;
    consistencyScore: number; // 0-100
    topPatterns: AnalysisResult[];
}
