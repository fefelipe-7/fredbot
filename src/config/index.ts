import dotenv from 'dotenv';
dotenv.config();

export interface AppConfig {
    discord: {
        token: string;
        clientId: string;
        guildId: string;
    };
    database: {
        url: string;
    };
    supabase: {
        url: string;
        anonKey: string;
    };
    scheduler: {
        dailyReportHour: number;
        dailyReportChannel: string;
    };
    channelModuleMap: Record<string, string>;
}

function requireEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`❌ Missing required environment variable: ${key}`);
    }
    return value;
}

export const config: AppConfig = {
    discord: {
        token: requireEnv('DISCORD_TOKEN'),
        clientId: requireEnv('DISCORD_CLIENT_ID'),
        guildId: requireEnv('DISCORD_GUILD_ID'),
    },
    database: {
        url: requireEnv('DATABASE_URL'),
    },
    supabase: {
        url: requireEnv('SUPABASE_URL'),
        anonKey: requireEnv('SUPABASE_ANON_KEY'),
    },
    scheduler: {
        dailyReportHour: parseInt(process.env.DAILY_REPORT_HOUR || '21', 10),
        dailyReportChannel: process.env.DAILY_REPORT_CHANNEL || 'relatorios',
    },
    // Channel name → module name mapping
    channelModuleMap: {
        'comando-central': 'core',
        'relatorios': 'core',
        'decisoes': 'memory',
        'prioridades': 'tasks',
        'tarefas': 'tasks',
        'projetos': 'goals',
        'registros': 'finance',
        'analises': 'finance',
        'humor': 'emotion',
        'sono': 'emotion',
        'treino': 'emotion',
    },
};
