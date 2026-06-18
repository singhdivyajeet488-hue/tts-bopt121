const { SlashCommandBuilder } = require('discord.js');
const ttsManager = require('../services/ttsManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leave')
        .setDescription('Instructs bot to clear memory traces, drop current connections, and exit voice channel instances.'),
    async execute(interaction) {
        ttsManager.leave(interaction.guildId);
        await interaction.reply({ content: '🚪 Disconnected from voice channel and cleared all internal configuration buffers.' });
    }
};
