import cron from 'node-cron';
import { Client, TextChannel } from 'discord.js';
import { config } from '../../config/index.js';
import { prisma } from '../../infrastructure/database/client.js';
import { tasksService } from '../../modules/tasks/service.js';
import { goalsService } from '../../modules/goals/service.js';
import { emotionService } from '../../modules/emotion/service.js';
import { insightGenerator } from '../../core/services/insight-generator.js';
import { EmbedBuilder } from 'discord.js';

/**
 * Schedules the daily report to run at the configured hour.
 */
export function scheduleDailyReport(client: Client): void {
    const hour = config.scheduler.dailyReportHour;
    const cronExpression = `0 ${hour} * * *`;

    cron.schedule(cronExpression, async () => {
        console.log(`📊 Running daily report at ${hour}:00...`);

        try {
            const guild = client.guilds.cache.first();
            if (!guild) return;

            // Find the report channel
            const reportChannel = guild.channels.cache.find(
                ch => ch.name === config.scheduler.dailyReportChannel
            ) as TextChannel | undefined;

            if (!reportChannel) {
                console.warn(`⚠️ Channel #${config.scheduler.dailyReportChannel} not found`);
                return;
            }

            // Get all users
            const users = await prisma.user.findMany();

            for (const user of users) {
                // Generate insights before report
                await insightGenerator.generateInsights(user.id);

                const [pendingTasks, completedToday, goals, moodTrend, insights] = await Promise.all([
                    tasksService.getPendingCount(user.id),
                    tasksService.getCompletedToday(user.id),
                    goalsService.getActiveGoalsSummary(user.id),
                    emotionService.getTrend(user.id, 1),
                    insightGenerator.getUnacknowledged(user.id),
                ]);

                const embed = new EmbedBuilder()
                    .setColor(0x7B68EE)
                    .setTitle(`📊 Relatório Diário — ${user.username}`)
                    .setDescription('Seu resumo do dia, senhor.')
                    .addFields(
                        { name: '✅ Tarefas Pendentes', value: `${pendingTasks}`, inline: true },
                        { name: '✔️ Concluídas Hoje', value: `${completedToday}`, inline: true },
                        { name: '🎯 Metas Ativas', value: `${goals.length}`, inline: true },
                    );

                if (goals.length > 0) {
                    const bar = (p: number) => '█'.repeat(Math.round(p / 10)) + '░'.repeat(10 - Math.round(p / 10));
                    embed.addFields({
                        name: '🎯 Progresso',
                        value: goals.slice(0, 5).map(g =>
                            `${bar(g.progress)} ${g.progress}% — ${g.title}`
                        ).join('\n'),
                    });
                }

                if (moodTrend.average !== null) {
                    embed.addFields({
                        name: '❤️ Humor',
                        value: `Média: ${moodTrend.average}/10 (${moodTrend.count} registros)`,
                    });
                }

                if (insights.length > 0) {
                    embed.addFields({
                        name: '💡 Insights Pendentes',
                        value: insights.slice(0, 3).map(i =>
                            `**${i.title}** — ${i.content}`
                        ).join('\n'),
                    });
                }

                embed.setTimestamp();
                embed.setFooter({ text: '🦇 Fred — "Always at your service, sir."' });

                await reportChannel.send({ embeds: [embed] });
            }

            console.log('✅ Daily report sent');
        } catch (error) {
            console.error('❌ Daily report error:', error);
        }
    });

    console.log(`⏰ Daily report scheduled at ${hour}:00`);
}
