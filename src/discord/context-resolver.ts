import { config } from '../config/index.js';
import { ModuleName } from '../core/types/index.js';

/**
 * Resolves which module should handle a message based on channel name.
 * This is the brain's "context switch" — the channel you're in determines
 * what Fred understands you're talking about.
 */
export function resolveModuleFromChannel(channelName: string): ModuleName {
    const mapped = config.channelModuleMap[channelName];

    switch (mapped) {
        case 'memory':
            return ModuleName.MEMORY;
        case 'goals':
            return ModuleName.GOALS;
        case 'tasks':
            return ModuleName.TASKS;
        case 'emotion':
            return ModuleName.EMOTION;
        case 'finance':
            return ModuleName.FINANCE;
        case 'core':
        default:
            return ModuleName.CORE;
    }
}

/**
 * Gets the emoji prefix for a module (used in Fred's responses).
 */
export function getModuleEmoji(module: ModuleName): string {
    const emojis: Record<ModuleName, string> = {
        [ModuleName.MEMORY]: '🧠',
        [ModuleName.GOALS]: '🎯',
        [ModuleName.TASKS]: '✅',
        [ModuleName.EMOTION]: '❤️',
        [ModuleName.FINANCE]: '💰',
        [ModuleName.CORE]: '🏛',
    };
    return emojis[module];
}
