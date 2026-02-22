import { Client, TextChannel } from 'discord.js';
import { resolveModuleFromChannel, getModuleEmoji } from '../context-resolver.js';
import { ModuleName } from '../../core/types/index.js';

/**
 * Handles natural language messages in context-aware channels.
 * When Fred detects a message in a mapped channel, he provides
 * contextual guidance based on the module.
 */
export function handleMessageCreate(client: Client): void {
    client.on('messageCreate', async (message) => {
        // Ignore bots and DMs
        if (message.author.bot) return;
        if (!message.guild) return;

        const channel = message.channel as TextChannel;
        if (!channel.name) return;

        const module = resolveModuleFromChannel(channel.name);

        // Only respond in mapped channels (not CORE)
        if (module === ModuleName.CORE) return;

        // Don't respond to every message — only if Fred is mentioned or it's a question
        const content = message.content.toLowerCase();
        const isMention = message.mentions.has(client.user!);
        const isQuestion = content.endsWith('?');

        if (!isMention && !isQuestion) return;

        const emoji = getModuleEmoji(module);
        const hints: Record<ModuleName, string> = {
            [ModuleName.MEMORY]: 'Use `/remember` para registrar algo ou `/recall` para buscar.',
            [ModuleName.GOALS]: 'Use `/goal create` para criar uma meta ou `/goal list` para ver suas metas.',
            [ModuleName.TASKS]: 'Use `/task add` para adicionar uma tarefa ou `/task list` para ver o backlog.',
            [ModuleName.EMOTION]: 'Use `/mood log` para registrar seu humor ou `/mood trend` para ver tendências.',
            [ModuleName.FINANCE]: 'Módulo financeiro ainda em desenvolvimento. Em breve!',
            [ModuleName.CORE]: '',
        };

        await message.reply(
            `${emoji} Estamos no contexto de **${module}**.\n${hints[module]}`
        );
    });
}
