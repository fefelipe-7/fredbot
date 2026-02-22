import { registerCommands } from './router.js';
import { config } from '../config/index.js';

/**
 * Standalone script to register slash commands with Discord.
 * Run: npm run register
 */
async function main() {
    console.log('🔄 Registering Fred commands...');
    console.log(`   Guild: ${config.discord.guildId}`);
    console.log(`   Client: ${config.discord.clientId}`);

    await registerCommands();

    console.log('✅ Done!');
    process.exit(0);
}

main().catch((error) => {
    console.error('❌ Registration failed:', error);
    process.exit(1);
});
