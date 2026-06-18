const { Events } = require('discord.js');
const pollManager = require('../services/pollManager');
const logger = require('../utils/logger');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                logger.error(`Error executing slash command /${interaction.commandName}:`, error);
                const replyOptions = { content: 'There was an error while executing this command!', ephemeral: true };
                if (interaction.deferred || interaction.replied) {
                    await interaction.followUp(replyOptions);
                } else {
                    await interaction.reply(replyOptions);
                }
            }
        } else if (interaction.isButton()) {
            const customId = interaction.customId;
            if (!customId.startsWith('poll_')) return;

            const [_, pollId, optionIndex] = customId.split('_');
            const poll = pollManager.polls.get(pollId);

            if (!poll) {
                return interaction.reply({ content: 'This poll is no longer active.', ephemeral: true });
            }

            const chosenOption = poll.options[parseInt(optionIndex, 10)];
            const updatedPoll = pollManager.handleVote(pollId, interaction.user.id, chosenOption);

            if (!updatedPoll) {
                return interaction.reply({ content: 'Failed to process vote.', ephemeral: true });
            }

            const updatedPayload = pollManager.generateEmbedAndComponents(updatedPoll, false);
            await interaction.update(updatedPayload);
        }
    },
};
