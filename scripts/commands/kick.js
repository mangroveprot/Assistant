const {
  isInRole1
} = global.utils;
module.exports = {
  config: {
    name: "kick",
    version: "1.0",
    author: "ViLLAVER",
    cooldown: 5,
    role: 1,
    description: "Kick members at the group",
    usage: "{n} @Tag Users to kick or reply",
    example: "kick @Name LastName or ↩️kick"
  },
  onStart: async function ({
    message, event, args, api
  }) {

    const botID = await api.getCurrentUserID();
    if (!await isInRole1(event, api, botID, event.threadID))
      return message.reply("⚠️ | Please add the bot as admin to this group before using this feature.");
    async function kickAndCheckError(uid) {
      try {
        await api.removeUserFromGroup(uid, event.threadID);
      }
      catch (e) {
        message.reply("⚠️ | Please add the bot as admin to this group before using this feature!");
        return "ERROR";
      }
    }
    if (!args[0]) {
      if (!event.messageReply)
        return message.reply("⚠️ | Reply to the message from the users or tag the users to kick.");
      await kickAndCheckError(event.messageReply.senderID);
    } else {
      const uids = Object.keys(event.mentions);
      if (uids.length === 0)
        return message.reply("⚠️ | Cant Get UID'S to this users.");
      if (await kickAndCheckError(uids.shift()) === "ERROR")
        return;
      for (const uid of uids)
        api.removeUserFromGroup(uid, event.threadID);
    }
  }
};