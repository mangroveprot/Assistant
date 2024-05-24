const fs = require('fs');
const path = require('path');
const {
  adminsBot
} = global.utils;
module.exports = {
  config: {
    name: "del",
    version: "1.0",
    author: "Villaver",
    cooldown: 5,
    role: 2,
    description: "Delete file at cmds",
    category: "owner",
    usage: " {p}{n} <cmd>",
    example: "del ai"
  },

  onStart: async function ({
    args, message, event
  }) {

    if (!adminsBot.includes(event.senderID)) {
      message.reply("You don't have enough permission to use this command. Only Ohio can do it.");
      return;
    }

    const fileNamesString = args.join
    const fileNames = fileNamesString.split(',').map(fileName => fileName.trim());

    if (fileNames.length === 0) {
      return message.reply("Type the file name(s) separated by commas.");
    }

    const deletedFiles = [];
    const notFoundFiles = [];

    fileNames.forEach((fileName) => {
      const filePath = path.join(__dirname, '..', 'cmds', `${fileName}.js`);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        deletedFiles.push(fileName);
      } else {
        notFoundFiles.push(fileName);
      }
    });

    let replyMessage = "";

    if (deletedFiles.length > 0) {
      replyMessage += `✅️ | Command file(s) have been deleted: ${deletedFiles.join(', ')}\n`;
    }

    if (notFoundFiles.length > 0) {
      replyMessage += `Command file(s) not found: ${notFoundFiles.join(', ')}\n`;
    }

    message.reply(replyMessage);
  }
};