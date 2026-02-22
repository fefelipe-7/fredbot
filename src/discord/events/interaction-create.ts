import { ChatInputCommandInteraction, Client, EmbedBuilder } from 'discord.js';
import { ensureUser } from '../../core/services/user-service.js';
import { memoryService } from '../../modules/memory/service.js';
import { goalsService } from '../../modules/goals/service.js';
import { tasksService } from '../../modules/tasks/service.js';
import { emotionService } from '../../modules/emotion/service.js';
import { insightGenerator } from '../../core/services/insight-generator.js';
import { MemoryType, Priority, GoalStatus, TaskStatus } from '@prisma/client';

const PRIORITY_EMOJI: Record<string, string> = {
    CRITICAL: '🔴',
    HIGH: '🟠',
    MEDIUM: '🟡',
    LOW: '🟢',
};

const TREND_EMOJI: Record<string, string> = {
    up: '📈',
    down: '📉',
    stable: '➡️',
    unknown: '❓',
};

export function handleInteractionCreate(client: Client): void {
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isChatInputCommand()) return;

        try {
            // Ensure user exists in DB
            const user = await ensureUser(
                interaction.user.id,
                interaction.user.username
            );

            switch (interaction.commandName) {
                case 'remember':
                    await handleRemember(interaction, user.id);
                    break;
                case 'recall':
                    await handleRecall(interaction, user.id);
                    break;
                case 'goal':
                    await handleGoal(interaction, user.id);
                    break;
                case 'task':
                    await handleTask(interaction, user.id);
                    break;
                case 'mood':
                    await handleMood(interaction, user.id);
                    break;
                case 'fred':
                    await handleFred(interaction, user.id);
                    break;
                case 'report':
                    await handleReport(interaction, user.id);
                    break;
                default:
                    await interaction.reply({
                        content: '❌ Comando desconhecido.',
                        ephemeral: true,
                    });
            }
        } catch (error) {
            console.error('❌ Interaction error:', error);
            const reply = {
                content: '❌ Algo deu errado. Tente novamente.',
                ephemeral: true,
            };
            if (interaction.deferred || interaction.replied) {
                await interaction.followUp(reply);
            } else {
                await interaction.reply(reply);
            }
        }
    });
}

// ─── /remember ─────────────────────────────────────

async function handleRemember(interaction: ChatInputCommandInteraction, userId: string) {
    const content = interaction.options.getString('content', true);
    const type = (interaction.options.getString('type') || 'NOTE') as MemoryType;
    const tagsRaw = interaction.options.getString('tags');
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()) : [];

    const memory = await memoryService.remember(userId, content, type, tags);

    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('🧠 Registrado')
        .setDescription(content)
        .addFields(
            { name: 'Tipo', value: type, inline: true },
            ...(tags.length > 0 ? [{ name: 'Tags', value: tags.join(', '), inline: true }] : [])
        )
        .setFooter({ text: `ID: ${memory.id.slice(0, 8)}` })
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

// ─── /recall ───────────────────────────────────────

async function handleRecall(interaction: ChatInputCommandInteraction, userId: string) {
    const query = interaction.options.getString('query');
    const type = interaction.options.getString('type') as MemoryType | null;

    const memories = await memoryService.recall(userId, query || undefined, type || undefined);

    if (memories.length === 0) {
        await interaction.reply({
            content: '🧠 Nenhuma memória encontrada.',
            ephemeral: true,
        });
        return;
    }

    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`🧠 Memórias${query ? ` — "${query}"` : ''}`)
        .setDescription(
            memories.map((m, i) =>
                `**${i + 1}.** [${m.type}] ${m.content}${m.tags.length > 0 ? `\n   🏷️ ${m.tags.join(', ')}` : ''}`
            ).join('\n\n')
        )
        .setFooter({ text: `${memories.length} resultado(s)` })
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

// ─── /goal ─────────────────────────────────────────

async function handleGoal(interaction: ChatInputCommandInteraction, userId: string) {
    const sub = interaction.options.getSubcommand();

    switch (sub) {
        case 'create': {
            const title = interaction.options.getString('title', true);
            const description = interaction.options.getString('description');
            const priority = (interaction.options.getString('priority') || 'MEDIUM') as Priority;
            const deadlineStr = interaction.options.getString('deadline');
            const deadline = deadlineStr ? new Date(deadlineStr) : undefined;

            const goal = await goalsService.create(userId, title, description || undefined, priority, deadline);

            const embed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('🎯 Meta Criada')
                .setDescription(`**${goal.title}**`)
                .addFields(
                    { name: 'Prioridade', value: `${PRIORITY_EMOJI[priority]} ${priority}`, inline: true },
                    { name: 'Progresso', value: '0%', inline: true },
                    ...(deadline ? [{ name: 'Prazo', value: deadline.toLocaleDateString('pt-BR'), inline: true }] : [])
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            break;
        }

        case 'list': {
            const status = interaction.options.getString('status') as GoalStatus | null;
            const goals = await goalsService.list(userId, status || undefined);

            if (goals.length === 0) {
                await interaction.reply({
                    content: '🎯 Nenhuma meta encontrada.',
                    ephemeral: true,
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('🎯 Suas Metas')
                .setDescription(
                    goals.map((g, i) => {
                        const bar = buildProgressBar(g.progress);
                        return `**${i + 1}. ${g.title}**\n${PRIORITY_EMOJI[g.priority]} ${g.priority} | ${bar} ${g.progress}% | 📋 ${g._count.tasks} tarefas`;
                    }).join('\n\n')
                )
                .setFooter({ text: `${goals.length} meta(s)` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            break;
        }

        case 'progress': {
            const title = interaction.options.getString('title', true);
            const percent = interaction.options.getInteger('percent', true);

            const goal = await goalsService.updateProgress(userId, title, percent);

            if (!goal) {
                await interaction.reply({
                    content: `❌ Meta "${title}" não encontrada.`,
                    ephemeral: true,
                });
                return;
            }

            const bar = buildProgressBar(goal.progress);
            const embed = new EmbedBuilder()
                .setColor(goal.progress >= 100 ? 0x00FF00 : 0xFFA500)
                .setTitle(goal.progress >= 100 ? '🏆 Meta Concluída!' : '🎯 Progresso Atualizado')
                .setDescription(`**${goal.title}**\n${bar} ${goal.progress}%`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            break;
        }
    }
}

// ─── /task ─────────────────────────────────────────

async function handleTask(interaction: ChatInputCommandInteraction, userId: string) {
    const sub = interaction.options.getSubcommand();

    switch (sub) {
        case 'add': {
            const title = interaction.options.getString('title', true);
            const priority = (interaction.options.getString('priority') || 'MEDIUM') as Priority;
            const dueStr = interaction.options.getString('due');
            const dueDate = dueStr ? new Date(dueStr) : undefined;
            const goalTitle = interaction.options.getString('goal');

            let goalId: string | undefined;
            if (goalTitle) {
                const goal = await tasksService.findGoalByTitle(userId, goalTitle);
                if (goal) goalId = goal.id;
            }

            const task = await tasksService.add(userId, title, priority, dueDate, goalId);

            const embed = new EmbedBuilder()
                .setColor(0x00BFFF)
                .setTitle('✅ Tarefa Adicionada')
                .setDescription(`**${task.title}**`)
                .addFields(
                    { name: 'Prioridade', value: `${PRIORITY_EMOJI[priority]} ${priority}`, inline: true },
                    ...(dueDate ? [{ name: 'Prazo', value: dueDate.toLocaleDateString('pt-BR'), inline: true }] : []),
                    ...(goalId ? [{ name: 'Meta', value: goalTitle!, inline: true }] : [])
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            break;
        }

        case 'list': {
            const status = interaction.options.getString('status') as TaskStatus | null;
            const tasks = await tasksService.list(userId, status || undefined);

            if (tasks.length === 0) {
                await interaction.reply({
                    content: '✅ Nenhuma tarefa encontrada.',
                    ephemeral: true,
                });
                return;
            }

            const statusEmoji: Record<string, string> = {
                PENDING: '⏳',
                IN_PROGRESS: '🔄',
                DONE: '✅',
                CANCELLED: '❌',
            };

            const embed = new EmbedBuilder()
                .setColor(0x00BFFF)
                .setTitle('✅ Suas Tarefas')
                .setDescription(
                    tasks.slice(0, 15).map((t, i) =>
                        `**${i + 1}.** ${statusEmoji[t.status]} ${t.title}\n   ${PRIORITY_EMOJI[t.priority]} ${t.priority}${t.goal ? ` | 🎯 ${t.goal.title}` : ''}${t.dueDate ? ` | 📅 ${new Date(t.dueDate).toLocaleDateString('pt-BR')}` : ''}`
                    ).join('\n\n')
                )
                .setFooter({ text: `${tasks.length} tarefa(s)${tasks.length > 15 ? ' (mostrando 15)' : ''}` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            break;
        }

        case 'done': {
            const title = interaction.options.getString('title', true);
            const task = await tasksService.markDone(userId, title);

            if (!task) {
                await interaction.reply({
                    content: `❌ Tarefa "${title}" não encontrada ou já concluída.`,
                    ephemeral: true,
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Tarefa Concluída!')
                .setDescription(`~~${task.title}~~ ✔️`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            break;
        }
    }
}

// ─── /mood ─────────────────────────────────────────

async function handleMood(interaction: ChatInputCommandInteraction, userId: string) {
    const sub = interaction.options.getSubcommand();

    switch (sub) {
        case 'log': {
            const mood = interaction.options.getString('mood', true);
            const intensity = interaction.options.getInteger('intensity', true);
            const context = interaction.options.getString('context');

            await emotionService.log(userId, mood, intensity, context || undefined);

            const moodBar = '█'.repeat(intensity) + '░'.repeat(10 - intensity);

            const embed = new EmbedBuilder()
                .setColor(intensity >= 7 ? 0x00FF00 : intensity >= 4 ? 0xFFFF00 : 0xFF0000)
                .setTitle('❤️ Humor Registrado')
                .addFields(
                    { name: 'Mood', value: mood, inline: true },
                    { name: 'Intensidade', value: `${moodBar} ${intensity}/10`, inline: true },
                    ...(context ? [{ name: 'Contexto', value: context }] : [])
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            break;
        }

        case 'trend': {
            const days = interaction.options.getInteger('days') || 7;
            const trend = await emotionService.getTrend(userId, days);

            if (trend.count === 0) {
                await interaction.reply({
                    content: `❤️ Nenhum registro de humor nos últimos ${days} dias.`,
                    ephemeral: true,
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setColor(0xFF69B4)
                .setTitle(`❤️ Tendência de Humor — ${days} dias`)
                .addFields(
                    { name: 'Média', value: `${trend.average}/10`, inline: true },
                    { name: 'Tendência', value: `${TREND_EMOJI[trend.trend]} ${trend.trend}`, inline: true },
                    { name: 'Registros', value: `${trend.count}`, inline: true },
                )
                .setDescription(
                    trend.entries.slice(-10).map(e =>
                        `**${new Date(e.date).toLocaleDateString('pt-BR')}** — ${e.mood} (${'█'.repeat(e.intensity)}${'░'.repeat(10 - e.intensity)} ${e.intensity}/10)`
                    ).join('\n')
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            break;
        }
    }
}

// ─── /fred ─────────────────────────────────────────

async function handleFred(interaction: ChatInputCommandInteraction, userId: string) {
    await interaction.deferReply();

    const message = interaction.options.getString('message', true);

    // Check for unread insights
    const insights = await insightGenerator.getUnacknowledged(userId);

    let response = `🦇 **Fred aqui.**\n\n`;
    response += `Você disse: *"${message}"*\n\n`;

    if (insights.length > 0) {
        response += `📋 **Tenho ${insights.length} insight(s) pendente(s):**\n`;
        for (const insight of insights) {
            response += `- **${insight.title}**: ${insight.content}\n`;
        }
    } else {
        response += `Tudo em ordem no momento. Continue focado. 🎯`;
    }

    const embed = new EmbedBuilder()
        .setColor(0x1a1a2e)
        .setTitle('🦇 Fred')
        .setDescription(response)
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
}

// ─── /report ───────────────────────────────────────

async function handleReport(interaction: ChatInputCommandInteraction, userId: string) {
    await interaction.deferReply();

    const type = interaction.options.getString('type') || 'daily';

    const [pendingTasks, completedToday, goals, moodTrend] = await Promise.all([
        tasksService.getPendingCount(userId),
        tasksService.getCompletedToday(userId),
        goalsService.getActiveGoalsSummary(userId),
        emotionService.getTrend(userId, type === 'weekly' ? 7 : 1),
    ]);

    const embed = new EmbedBuilder()
        .setColor(0x7B68EE)
        .setTitle(`📊 Relatório ${type === 'weekly' ? 'Semanal' : 'Diário'}`)
        .addFields(
            { name: '✅ Tarefas Pendentes', value: `${pendingTasks}`, inline: true },
            { name: '✔️ Concluídas Hoje', value: `${completedToday}`, inline: true },
            { name: '🎯 Metas Ativas', value: `${goals.length}`, inline: true },
        );

    if (goals.length > 0) {
        embed.addFields({
            name: '🎯 Progresso das Metas',
            value: goals.map(g =>
                `${buildProgressBar(g.progress)} ${g.progress}% — ${g.title}`
            ).join('\n'),
        });
    }

    if (moodTrend.average !== null) {
        embed.addFields({
            name: '❤️ Humor',
            value: `Média: ${moodTrend.average}/10 ${TREND_EMOJI[moodTrend.trend]} (${moodTrend.count} registros)`,
        });
    }

    embed.setTimestamp();
    await interaction.editReply({ embeds: [embed] });
}

// ─── Helpers ────────────────────────────────────────

function buildProgressBar(percent: number): string {
    const filled = Math.round(percent / 10);
    return '█'.repeat(filled) + '░'.repeat(10 - filled);
}
