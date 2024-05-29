const axios = require("axios");
const { getStreamFromURL, getName, API } = global.utils;

module.exports = {
  config: {
    name: "video",
    version: "1.0",
    author: "ViLLAVER",
    role: 0,
    cooldown: 30,
    shortDescription:
      "Download Video From Youtube. 80mb is the limit of the video.",
    longDescription: "",
    category: "media",
    guide: {
      en: "{p}{n} or {n}",
    },
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, senderID } = event;
    const name = await getName(api, senderID);
    const prompt = args.join(" ");

    if (!prompt) {
      return api.sendMessage(
        "❗ | Please add a title to search.",
        threadID,
        event.messageID
      );
    }

    try {
      const waitingQue = await api.sendMessage(
        "🔍 | Please wait while searching for your videos.",
        threadID
      );

      api.setMessageReaction(
        "🔍",
        event.messageID,
        (err) => {
          if (err) console.error(err);
        },
        true
      );

      const res = await axios.get(
        `${API}/api/video?title=${prompt}&uid=${senderID}&name=${name}`
      );
      const { title, video } = res.data;
      console.log(`Downloadable Video URL: ${video}`);

      const attachment = await getStreamFromURL(video);

      await api.sendMessage(
        {
          body: title,
          attachment: attachment,
        },
        event.threadID,
        async (err, info) => {
          if (err) {
            console.error(err);
            await api.unsendMessage(waitingQue.messageID);
          }
        },
        event.messageID
      );
    } catch (err) {
      console.error("Error:", err);
      return api.sendMessage(
        "Error: An error occurred while processing the command.",
        threadID
      );
    }
  },
};
