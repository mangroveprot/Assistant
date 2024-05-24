module.exports = {
  config: {
    name: "tist",
    description: "Briefly describes what the command does.",
    usage: ":example",
    author: "AuthorName",
    version: "1.0.0",
    cooldown: 5,
    role: 0
  },
  onStart: async function ({
    api, event, args
  }) {
    if (args[1] === "t") {
      api.sendMessage("Hello from the example command!", event.threadID, event.messageID);
    } else {
      api.sendMessage("Hello from the example command!", event.threadID, event.messageID);
    }
  }
};