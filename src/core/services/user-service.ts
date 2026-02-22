import { prisma } from '../../infrastructure/database/client.js';

/**
 * Ensures a User record exists in the DB for the given Discord user.
 * Fred needs to know who he's serving.
 */
export async function ensureUser(discordId: string, username: string) {
    return prisma.user.upsert({
        where: { discordId },
        update: { username },
        create: { discordId, username },
    });
}
