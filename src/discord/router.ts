import {
    REST,
    Routes,
    SlashCommandBuilder,
    SlashCommandSubcommandBuilder,
} from 'discord.js';
import { config } from '../config/index.js';

/**
 * All of Fred's slash commands, organized by module.
 */
export function buildCommands(): SlashCommandBuilder[] {
    const commands: SlashCommandBuilder[] = [];

    // ─── /remember ─────────────────────────────
    commands.push(
        new SlashCommandBuilder()
            .setName('remember')
            .setDescription('🧠 Store a memory (decision, idea, note, person)')
            .addStringOption(opt =>
                opt.setName('content')
                    .setDescription('What should Fred remember?')
                    .setRequired(true)
            )
            .addStringOption(opt =>
                opt.setName('type')
                    .setDescription('Type of memory')
                    .setRequired(false)
                    .addChoices(
                        { name: '💡 Idea', value: 'IDEA' },
                        { name: '⚖️ Decision', value: 'DECISION' },
                        { name: '📝 Note', value: 'NOTE' },
                        { name: '👤 Person', value: 'PERSON' },
                    )
            )
            .addStringOption(opt =>
                opt.setName('tags')
                    .setDescription('Tags separated by commas (e.g. work,important)')
                    .setRequired(false)
            ) as SlashCommandBuilder
    );

    // ─── /recall ───────────────────────────────
    commands.push(
        new SlashCommandBuilder()
            .setName('recall')
            .setDescription('🧠 Search your memories')
            .addStringOption(opt =>
                opt.setName('query')
                    .setDescription('What are you looking for?')
                    .setRequired(false)
            )
            .addStringOption(opt =>
                opt.setName('type')
                    .setDescription('Filter by type')
                    .setRequired(false)
                    .addChoices(
                        { name: '💡 Ideas', value: 'IDEA' },
                        { name: '⚖️ Decisions', value: 'DECISION' },
                        { name: '📝 Notes', value: 'NOTE' },
                        { name: '👤 People', value: 'PERSON' },
                    )
            ) as SlashCommandBuilder
    );

    // ─── /goal ─────────────────────────────────
    const goalCmd = new SlashCommandBuilder()
        .setName('goal')
        .setDescription('🎯 Manage your goals');

    goalCmd.addSubcommand(
        new SlashCommandSubcommandBuilder()
            .setName('create')
            .setDescription('Create a new goal')
            .addStringOption(opt =>
                opt.setName('title').setDescription('Goal title').setRequired(true)
            )
            .addStringOption(opt =>
                opt.setName('description').setDescription('Goal description').setRequired(false)
            )
            .addStringOption(opt =>
                opt.setName('priority')
                    .setDescription('Priority level')
                    .setRequired(false)
                    .addChoices(
                        { name: '🔴 Critical', value: 'CRITICAL' },
                        { name: '🟠 High', value: 'HIGH' },
                        { name: '🟡 Medium', value: 'MEDIUM' },
                        { name: '🟢 Low', value: 'LOW' },
                    )
            )
            .addStringOption(opt =>
                opt.setName('deadline').setDescription('Deadline (YYYY-MM-DD)').setRequired(false)
            )
    );

    goalCmd.addSubcommand(
        new SlashCommandSubcommandBuilder()
            .setName('list')
            .setDescription('List your goals')
            .addStringOption(opt =>
                opt.setName('status')
                    .setDescription('Filter by status')
                    .setRequired(false)
                    .addChoices(
                        { name: '🟢 Active', value: 'ACTIVE' },
                        { name: '✅ Completed', value: 'COMPLETED' },
                        { name: '⏸ Paused', value: 'PAUSED' },
                    )
            )
    );

    goalCmd.addSubcommand(
        new SlashCommandSubcommandBuilder()
            .setName('progress')
            .setDescription('Update goal progress')
            .addStringOption(opt =>
                opt.setName('title').setDescription('Goal title (partial match)').setRequired(true)
            )
            .addIntegerOption(opt =>
                opt.setName('percent').setDescription('Progress percentage (0-100)').setRequired(true)
                    .setMinValue(0).setMaxValue(100)
            )
    );

    commands.push(goalCmd as SlashCommandBuilder);

    // ─── /task ─────────────────────────────────
    const taskCmd = new SlashCommandBuilder()
        .setName('task')
        .setDescription('✅ Manage your tasks');

    taskCmd.addSubcommand(
        new SlashCommandSubcommandBuilder()
            .setName('add')
            .setDescription('Add a new task')
            .addStringOption(opt =>
                opt.setName('title').setDescription('Task title').setRequired(true)
            )
            .addStringOption(opt =>
                opt.setName('priority')
                    .setDescription('Priority level')
                    .setRequired(false)
                    .addChoices(
                        { name: '🔴 Critical', value: 'CRITICAL' },
                        { name: '🟠 High', value: 'HIGH' },
                        { name: '🟡 Medium', value: 'MEDIUM' },
                        { name: '🟢 Low', value: 'LOW' },
                    )
            )
            .addStringOption(opt =>
                opt.setName('due').setDescription('Due date (YYYY-MM-DD)').setRequired(false)
            )
            .addStringOption(opt =>
                opt.setName('goal').setDescription('Link to goal (title partial match)').setRequired(false)
            )
    );

    taskCmd.addSubcommand(
        new SlashCommandSubcommandBuilder()
            .setName('list')
            .setDescription('List your tasks')
            .addStringOption(opt =>
                opt.setName('status')
                    .setDescription('Filter by status')
                    .setRequired(false)
                    .addChoices(
                        { name: '⏳ Pending', value: 'PENDING' },
                        { name: '🔄 In Progress', value: 'IN_PROGRESS' },
                        { name: '✅ Done', value: 'DONE' },
                    )
            )
    );

    taskCmd.addSubcommand(
        new SlashCommandSubcommandBuilder()
            .setName('done')
            .setDescription('Mark a task as done')
            .addStringOption(opt =>
                opt.setName('title').setDescription('Task title (partial match)').setRequired(true)
            )
    );

    commands.push(taskCmd as SlashCommandBuilder);

    // ─── /mood ─────────────────────────────────
    const moodCmd = new SlashCommandBuilder()
        .setName('mood')
        .setDescription('❤️ Track your emotional state');

    moodCmd.addSubcommand(
        new SlashCommandSubcommandBuilder()
            .setName('log')
            .setDescription('Log your current mood')
            .addStringOption(opt =>
                opt.setName('mood').setDescription('How are you feeling?').setRequired(true)
            )
            .addIntegerOption(opt =>
                opt.setName('intensity').setDescription('Intensity (1-10)')
                    .setRequired(true).setMinValue(1).setMaxValue(10)
            )
            .addStringOption(opt =>
                opt.setName('context').setDescription('What triggered this?').setRequired(false)
            )
    );

    moodCmd.addSubcommand(
        new SlashCommandSubcommandBuilder()
            .setName('trend')
            .setDescription('View your mood trend')
            .addIntegerOption(opt =>
                opt.setName('days').setDescription('Number of days to analyze (default: 7)')
                    .setRequired(false).setMinValue(1).setMaxValue(90)
            )
    );

    commands.push(moodCmd as SlashCommandBuilder);

    // ─── /fred ─────────────────────────────────
    commands.push(
        new SlashCommandBuilder()
            .setName('fred')
            .setDescription('🏛 Talk to Fred directly')
            .addStringOption(opt =>
                opt.setName('message')
                    .setDescription('What do you want to say?')
                    .setRequired(true)
            ) as SlashCommandBuilder
    );

    // ─── /report ───────────────────────────────
    commands.push(
        new SlashCommandBuilder()
            .setName('report')
            .setDescription('📊 Generate a report on demand')
            .addStringOption(opt =>
                opt.setName('type')
                    .setDescription('Report type')
                    .setRequired(false)
                    .addChoices(
                        { name: '📅 Daily', value: 'daily' },
                        { name: '📆 Weekly', value: 'weekly' },
                    )
            ) as SlashCommandBuilder
    );

    return commands;
}

/**
 * Registers all slash commands with Discord API.
 */
export async function registerCommands(): Promise<void> {
    const rest = new REST({ version: '10' }).setToken(config.discord.token);
    const commands = buildCommands().map(cmd => cmd.toJSON());

    try {
        console.log(`🔄 Registering ${commands.length} slash commands...`);

        await rest.put(
            Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId),
            { body: commands }
        );

        console.log(`✅ ${commands.length} commands registered successfully`);
    } catch (error) {
        console.error('❌ Failed to register commands:', error);
        throw error;
    }
}
