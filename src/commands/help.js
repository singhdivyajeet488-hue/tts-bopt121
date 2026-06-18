const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Displays information and usage examples for all available commands.'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🤖 Bot Commands & System Manual')
            .setColor(0x7289DA)
            .addFields(
                { name: '📊 /poll', value: 'Creates an inline interactive button-based poll.\n*Usage:* `/poll question:"Best language?" options:"Python, JS, Rust" duration:10`' },
                { name: '🔊 /join', value: 'Joins your current voice channel and starts parsing incoming text to TTS speech sequence.' },
                { name: '🤫 /tts', value: 'Toggle active speech parsing execution state toggling active playback output.\n*Usage:* `/tts enabled:false`' },
                { name: '🚪 /leave', value: 'Disconnects safely dropping active sessions and flushes tracking buffers.' }
            );
        await interaction.reply({ embeds: [embed] });
    }
};
