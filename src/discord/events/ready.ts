import { Client } from 'discord.js';

export function handleReady(client: Client): void {
    client.on('ready', () => {
        console.log(`\n🦇 Fred is online as ${client.user?.tag}`);
        console.log(`📡 Serving ${client.guilds.cache.size} guild(s)`);
        console.log('─'.repeat(40));

        // Set activity
        client.user?.setActivity('Organizing your life', { type: 3 }); // "Watching"
    });
}
