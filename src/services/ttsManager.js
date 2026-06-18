const { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    AudioPlayerStatus, 
    VoiceConnectionStatus, 
    getVoiceConnection,
    entersState
} = require('@discordjs/voice');
const prism = require('prism-media');
const ffmpeg = require('ffmpeg-static');
const logger = require('../utils/logger');

class TtsManager {
    constructor() {
        this.sessions = new Map(); // guildId -> session config
    }

    join(guildId, voiceChannelId, textChannelId, adapterCreator) {
        const connection = joinVoiceChannel({
            channelId: voiceChannelId,
            guildId: guildId,
            adapterCreator: adapterCreator,
            selfMute: false,
            selfDeaf: true
        });

        const player = createAudioPlayer();
        connection.subscribe(player);

        const session = {
            textChannelId,
            voiceChannelId,
            connection,
            player,
            queue: [],
            isPlaying: false,
            enabled: true
        };

        player.on(AudioPlayerStatus.Idle, () => {
            session.isPlaying = false;
            this.processQueue(guildId);
        });

        player.on('error', error => {
            logger.error(`Audio player error in guild ${guildId}:`, error);
            session.isPlaying = false;
            this.processQueue(guildId);
        });

        connection.on(VoiceConnectionStatus.Disconnected, async () => {
            try {
                await Promise.race([
                    entersState(connection, VoiceConnectionStatus.Signalling, 5000),
                    entersState(connection, VoiceConnectionStatus.Connecting, 5000),
                ]);
            } catch (error) {
                this.leave(guildId);
            }
        });

        this.sessions.set(guildId, session);
    }

    leave(guildId) {
        const session = this.sessions.get(guildId);
        if (session) {
            try {
                session.player.stop();
                session.connection.destroy();
            } catch (e) {}
            this.sessions.delete(guildId);
        }
    }

    toggleTts(guildId, enabled) {
        const session = this.sessions.get(guildId);
        if (!session) return false;
        session.enabled = enabled;
        if (!enabled) session.queue = [];
        return true;
    }

    isActive(guildId, textChannelId) {
        const session = this.sessions.get(guildId);
        return session && session.enabled && session.textChannelId === textChannelId;
    }

    queueMessage(guildId, text) {
        const session = this.sessions.get(guildId);
        if (!session || !session.enabled) return;

        session.queue.push(text);
        if (!session.isPlaying) {
            this.processQueue(guildId);
        }
    }

    async processQueue(guildId) {
        const session = this.sessions.get(guildId);
        if (!session || session.isPlaying || session.queue.length === 0) return;

        session.isPlaying = true;
        const text = session.queue.shift();

        try {
            // Using a highly resilient, alternative open TTS mirror endpoint
            const encodedText = encodeURIComponent(text);
            const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodedText}`;

            const process = new prism.FFmpeg({
                args: [
                    '-headers', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36\r\n',
                    '-i', url,
                    '-f', 's16le',
                    '-ar', '48000',
                    '-ac', '2'
                ],
                shell: false,
                command: ffmpeg
            });

            const resource = createAudioResource(process, {
                inputType: 'raw'
            });

            session.player.play(resource);
        } catch (error) {
            logger.error(`Error generating/playing alternative TTS in guild ${guildId}:`, error);
            session.isPlaying = false;
            this.processQueue(guildId);
        }
    }
}

module.exports = new TtsManager();
