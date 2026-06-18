const { SlashCommandBuilder } = require('discord.js');
const ttsManager = require('../services/ttsManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Requests the Bot entity lock voice structures routing streaming channels data arrays to listeners.'),
    async execute(interaction) {
        const member = interaction.member;
        if (!member || !member.voice.channel) {
            return interaction.reply({ content: '❌ You must be connected to a voice channel to use this command!', ephemeral: true });
        }

        const voiceChannel = member.voice.channel;
        
        ttsManager.join(
            interaction.guildId,
            voiceChannel.id,
            interaction.channelId,
            interaction.guild.voiceAdapterCreator
        );

        await interaction.reply({ 
            content: `🔊 Joined **${voiceChannel.name}**! TTS is now listening exclusively to messages from this channel.` 
        });
    }
};
