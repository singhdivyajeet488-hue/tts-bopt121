const { Events } = require('discord.js');
const ttsManager = require('../services/ttsManager');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // Filter criteria out fast
        if (message.author.bot) return;
        if (!message.guild) return;
        if (message.content.startsWith('/')) return; // Ignore clear slash command attempts if parsed as text
        
        const guildId = message.guild.id;
        if (!ttsManager.isActive(guildId, message.channel.id)) return;

        let content = message.content.trim();

        // Strict Filters
        if (!content && message.attachments.size > 0) return; // Only attachments
        if (content.length > 500) {
            content = content.substring(0, 497) + '...';
        }

        // Clean content protection (removes mass mentions cleanly)
        if (content.includes('@everyone') || content.includes('@here')) {
            content = content.replace(/@everyone/g, 'everyone').replace(/@here/g, 'here');
        }

        const displayName = message.member ? message.member.displayName : message.author.username;
        const speechText = `${displayName} says: ${content}`;

        ttsManager.queueMessage(guildId, speechText);
    },
};
