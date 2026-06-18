const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class PollManager {
    constructor() {
        this.polls = new Map();
    }

    createPoll(messageId, creatorId, question, options, durationMs, channel) {
        const votes = {};
        options.forEach(opt => votes[opt] = []);

        const poll = {
            id: messageId,
            creatorId,
            question,
            options,
            votes,
            userVotes: new Map(), // userId -> option
            endTime: Date.now() + durationMs,
            channelId: channel.id,
            timeout: setTimeout(() => this.endPoll(messageId, channel.client), durationMs)
        };

        this.polls.set(messageId, poll);
        return poll;
    }

    handleVote(messageId, userId, option) {
        const poll = this.polls.get(messageId);
        if (!poll) return null;

        const previousVote = poll.userVotes.get(userId);
        if (previousVote === option) {
            // Toggle vote off if clicking the same choice
            poll.userVotes.delete(userId);
            poll.votes[option] = poll.votes[option].filter(id => id !== userId);
        } else {
            // Remove from old choice if exists
            if (previousVote) {
                poll.votes[previousVote] = poll.votes[previousVote].filter(id => id !== userId);
            }
            // Add to new choice
            poll.userVotes.set(userId, option);
            poll.votes[option].push(userId);
        }

        return poll;
    }

    generateEmbedAndComponents(poll, closed = false) {
        const totalVotes = poll.userVotes.size;
        const embed = new EmbedBuilder()
            .setTitle(`📊 Poll: ${poll.question}`)
            .setColor(closed ? 0x7289DA : 0x00FF00)
            .setTimestamp();

        if (closed) {
            embed.setDescription('### This poll has concluded.');
        } else {
            embed.setDescription(`Voting ends <t:${Math.floor(poll.endTime / 1000)}:R>`);
        }

        const rows = [];
        let currentRow = new ActionRowBuilder();

        poll.options.forEach((option, index) => {
            const count = poll.votes[option].length;
            const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            
            // Visual Progress Bar
            const barLength = 10;
            const filledLength = totalVotes > 0 ? Math.round((count / totalVotes) * barLength) : 0;
            const bar = '🟩'.repeat(filledLength) + '⬛'.repeat(barLength - filledLength);

            embed.addFields({
                name: `${index + 1}. ${option}`,
                value: `${bar} ${count} votes (${percentage}%)`,
                inline: false
            });

            const button = new ButtonBuilder()
                .setCustomId(`poll_${poll.id}_${index}`)
                .setLabel(option.substring(0, 80))
                .setStyle(ButtonStyle.Primary)
                .setDisabled(closed);

            if (currentRow.components.length >= 5) {
                rows.push(currentRow);
                currentRow = new ActionRowBuilder();
            }
            currentRow.addComponents(button);
        });

        if (currentRow.components.length > 0) {
            rows.push(currentRow);
        }

        if (closed) {
            let maxVotes = -1;
            let winners = [];
            poll.options.forEach(option => {
                const count = poll.votes[option].length;
                if (count > maxVotes) {
                    maxVotes = count;
                    winners = [option];
                } else if (count === maxVotes && count > 0) {
                    winners.push(option);
                }
            });

            const winnerText = totalVotes === 0 
                ? 'Nobody voted!' 
                : `🏆 **Winner(s):** ${winners.join(', ')} (${maxVotes} votes)`;
            
            embed.addFields({ name: 'Final Results', value: `${winnerText}\nTotal unique participants: ${totalVotes}` });
        }

        return { embeds: [embed], components: rows };
    }

    async endPoll(messageId, client) {
        const poll = this.polls.get(messageId);
        if (!poll) return;

        clearTimeout(poll.timeout);
        this.polls.delete(messageId);

        try {
            const channel = await client.channels.fetch(poll.channelId);
            const message = await channel.messages.fetch(messageId);
            const updatedPayload = this.generateEmbedAndComponents(poll, true);
            await message.edit(updatedPayload);
        } catch (error) {
            // Message or channel might have been deleted
        }
    }
}

module.exports = new PollManager();
