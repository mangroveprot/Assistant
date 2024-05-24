const fs = require('fs');
const {
  hasPrefix,
  prefix
} = global.utils.config.assistant;
const {
  configPath,
  isInRole2
} = global.utils;

module.exports = {
  config: {
    name: "prefix",
    description: "Change your prefixes and also activate or deactivate the bot prefix.",
    usage: "{p}{n} <edit/change> <prefix to change>\n,{p}{n} <mode> <on/off>",
    author: "ViLLAVER",
    version: "1.0.0",
    cooldown: 5,
    role: 0
  },
  onStart: async function ({
    api, event, args, message
  }) {
    try {
      const permission = (await isInRole2(api, event.senderID));
      const config = require(configPath);
      const myPrefix = hasPrefix ? prefix: "No Prefix";
      const action = args[0] ? args[0].toLowerCase(): null;
      const pfx = hasPrefix ? prefix: "";

      if (!action) {
        const output = [
          '┌────[🪶]────⦿',
          `│✨ My Prefix: ${myPrefix}`,
          `│ ⸦•⸧ Type "${pfx}help" to show all my available commands.`,
          '└────────⦿'
        ];
        return message.reply(output.join("\n"));
      }
      if (!isInRole2) {
        return message.reply("⚠️ You dont have permission to use this action only bot admins can use this actions");
      }
      switch (action) {
        case "edit":
        case "change":
          const newPrefix = args[1];
          if (!newPrefix) {
            return message.reply("Please add a prefix to change the bot prefixes.");
          }
          config.assistant.prefix = newPrefix;
          fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
          return message.reply(`Prefix changed to "${newPrefix}"`);

        case "mode":
          const newSetting = args[1] ? args[1].toLowerCase(): null;

          if (newSetting !== "on" && newSetting !== "off" && newSetting.length < 1) {
            return message.reply("Invalid setting. Please use 'on' or 'off'.");
          }

          config.assistant.hasPrefix = newSetting === "on";

          fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
          return message.reply(`'hasPrefix' setting updated to '${newSetting}'.`);

        default:
          return message.reply(`Invalid action. Please type "${myPrefix}help prefix" to show on how to use this command.`);
      }
    } catch (error) {
      console.error("An error occurred:", error);
      return message.reply("An error occurred while processing your request.");
    }
  }
};