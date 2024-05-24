module.exports = {
  config: {
    name: "tid",
    version: "1.1",
    description: "Get the Thread ID",
    author: "ViLLAVER",
    cooldown: 5,
    role: 0,
    usage: "{n} or {p}{n}",
    example: "tid"
  },

  onStart: async function ({
    message, event
  }) {
    message.reply(event.threadID);
  }
};