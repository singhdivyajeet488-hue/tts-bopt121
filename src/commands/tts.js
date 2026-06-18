const { SlashCommandBuilder } = require('discord.js');
const ttsManager = require('../services/ttsManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tts')
        .setDescription('Toggles active reading states dynamically.')
        .addBooleanOption(opt => opt.setName('enabled').setDescription('Set runtime execution parameter boolean').setRequired(true)),
    async execute(interaction) {
        const enabled = interaction.options.getBoolean('enabled');
        const success = ttsManager.toggleTts(interaction.guildId, enabled);

        if (!success) {
            return interaction.reply({ content: '❌ No active voice session discovered. Execute `/join` first.', ephemeral: true });
        }

        await interaction.reply({ content: `TTS stream has been successfully **${enabled ? 'enabled' : 'disabled'}**.` });
    }
};
