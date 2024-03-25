const { Client, Events, GatewayIntentBits } = require("discord.js");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, entersState, VoiceConnectionStatus, StreamType } = require('@discordjs/voice');
const fs = require("fs");
const prism = require("prism-media");

const config = require("./config.json");
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates] });

client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.MessageCreate, async message => {
    console.log(`Message received: ${message.content}`);
    if (message.content === "listen") {
        if (message.member.voice.channel) {
            const connection = joinVoiceChannel({
                channelId: message.member.voice.channel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator,
                selfDeaf: false,
            });

            try {
                await entersState(connection, VoiceConnectionStatus.Ready, 30e3);
                const receiver = connection.receiver;
                const userId = message.author.id;
                const writeStream = fs.createWriteStream('out.pcm');
                const listenStream = receiver.subscribe(userId, { end: { behavior: 'silence', duration: 100 } });

                const opusDecoder = new prism.opus.Decoder({
                    frameSize: 960,
                    channels: 2,
                    rate: 48000,
                });

                listenStream.pipe(opusDecoder).pipe(writeStream);

                listenStream.on('end', () => {
                    console.log("Recording ended.");
                    writeStream.end();
                });

            } catch (error) {
                console.error(error);
            }
        }
    }
});


client.login(config.token);
