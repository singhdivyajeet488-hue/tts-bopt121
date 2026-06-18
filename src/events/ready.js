const { Events, ActivityType } = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        logger.info(`Logged in securely as ${client.user.tag}!`);
        client.user.setActivity('polls & reading chat', { type: ActivityType.Listening });
    },
};
