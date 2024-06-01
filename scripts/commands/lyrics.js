const axios = require("axios");
const { getSong } = require("genius-lyrics-api");
const { getStreamFromURL, getName, config } = global.utils;
const { geniusKey } = config.apiKeys;

module.exports = {
  config: {
    name: "lyrics",
    version: "1.0",
    author: "VɪLLAVER",
    cooldown: 30,
    role: 0,
    description: "Get lyrics of a song.",
  },

  onStart: async function ({ message, event, args, api }) {
    const { senderID, messageID } = event;
    const prompt = args.join(" ");
    if (!prompt) {
      return message.reply(
        "❗ | Kindly add a title to search! And Try Again..."
      );
    }
    if (!geniusKey) {
      return message.reply(
        "❗ | Kindly add a genius key in json/config.json! And Try Again..."
      );
    }

    try {
      api.setMessageReaction(
        "🎧",
        event.messageID,
        (err) => {
          if (err) console.error(err);
        },
        true
      );

      const waitingQuery = await message.reply(
        "⏳ | Please wait while searching for your song!"
      );

      const options = {
        apiKey: geniusKey,
        title: prompt,
        artist: " ",
        optimizeQuery: true,
      };

      getSong(options).then(async (song) => {
        if (!song) {
          await message.unsend(waitingQuery.messageID);
          return message.reply(
            "❗ | Could not find the song. Please try again with a different title."
          );
        }

        const attachment = await getStreamFromURL(song.albumArt);

        await message.reply({
          body: `${song.title}\n\n${song.lyrics}`,
          attachment: attachment,
        });

        await message.unsend(waitingQuery.messageID);
      });
    } catch (error) {
      console.error(error);
      api.sendMessage(
        `❗ | An error occurred: ${error}`,
        event.threadID,
        event.messageID
      );
    }
  },
};
