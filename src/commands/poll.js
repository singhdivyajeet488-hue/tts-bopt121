const { SlashCommandBuilder } = require('discord.js');
const pollManager = require('../services/pollManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Creates an interactive polling window.')
        .addStringOption(opt => opt.setName('question').setDescription('The prompt question').setRequired(true))
        .addStringOption(opt => opt.setName('options').setDescription('Comma separated option parameters').setRequired(true))
        .addIntegerOption(opt => opt.setName('duration').setDescription('Execution bounds tracking context window runtime in minutes').setRequired(true)),
    async execute(interaction) {
        const question = interaction.options.getString('question');
        const rawOptions = interaction.options.getString('options');
        const durationMin = interaction.options.getInteger('duration');

        const options = rawOptions.split(',').map(o => o.trim()).filter(o => o.length > 0);

        if (options.length < 2 || options.length > 10) {
            return interaction.reply({ content: '❌ You must provide between 2 and 10 options.', ephemeral: true });
        }

        if (durationMin <= 0) {
            return interaction.reply({ content: '❌ Duration must be at least 1 minute.', ephemeral: true });
        }

        // Acknowledge interaction dynamically first
        await interaction.reply({ content: 'Creating poll...', fetchReply: true });

        const durationMs = durationMin * 60 * 1000;
        const message = await interaction.fetchReply();
        
        const poll = pollManager.createPoll(message.id, interaction.user.id, question, options, durationMs, interaction.channel);
        const payload = pollManager.generateEmbedAndComponents(poll, false);

        await interaction.editReply({ content: null, ...payload });
    }
};
