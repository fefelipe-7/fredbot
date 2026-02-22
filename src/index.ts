import { config } from './config/index.js';
import { createDiscordClient } from './discord/client.js';
import { connectDatabase, disconnectDatabase } from './infrastructure/database/client.js';
import { registerCommands } from './discord/router.js';
import { handleReady } from './discord/events/ready.js';
import { handleInteractionCreate } from './discord/events/interaction-create.js';
import { handleMessageCreate } from './discord/events/message-create.js';
import { scheduleDailyReport } from './application/schedulers/daily-report.js';

async function bootstrap(): Promise<void> {
    console.log('');
    console.log('🦇 ═══════════════════════════════════');
    console.log('   F R E D — Your Personal Alfred');
    console.log('   Strategic Agent • Nexus Engine');
    console.log('🦇 ═══════════════════════════════════');
    console.log('');

    // 1. Connect to database
    console.log('📦 Connecting to database...');
    await connectDatabase();

    // 2. Create Discord client
    console.log('🤖 Initializing Discord client...');
    const client = createDiscordClient();

    // 3. Register event handlers
    handleReady(client);
    handleInteractionCreate(client);
    handleMessageCreate(client);

    // 4. Register slash commands
    console.log('📝 Registering slash commands...');
    await registerCommands();

    // 5. Schedule reports
    scheduleDailyReport(client);

    // 6. Login
    console.log('🔑 Logging in to Discord...');
    await client.login(config.discord.token);

    // Graceful shutdown
    const shutdown = async () => {
        console.log('\n🛑 Shutting down Fred...');
        client.destroy();
        await disconnectDatabase();
        process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

bootstrap().catch((error) => {
    console.error('💀 Fred failed to start:', error);
    process.exit(1);
});
