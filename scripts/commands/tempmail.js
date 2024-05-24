const axios = require('axios');

module.exports = {
  config: {
    name: "tempmail",
    description: "Get 10minutes mail.",
    usage: "To check your tempmail: {pn} <action> <email>\n\nTo generate your unique email: {pn} <action> <your tags>",
    example: "To check tempmail: tempmail check 2ciu8.<myuniquetags>@inbox.testmail.app\n\nTo generate: tempmail gen myUniqetags",
    author: "ViLLAVER",
    version: "1.0.0",
    cooldown: 30,
    role: 0
  },
  onStart: async function ({
    api, event, args, message
  }) {
    switch (args[0]) {
      case "gen":
      case "generate":
        const tag = args[1];
        if (!tag) {
          await api.sendMessage("⚠️ | Please provide a tag for the email address. For more info type 'help tempmail' for more info on this command", event.threadID);
          return;
        }
        const email = `2ciu8.${tag}@inbox.testmail.app`;
        message.reply(`Your unique email address is: ${email}`);
        break;
      case "check":
      case "c":
        const APIKEY = "2755914a-578d-4aa8-a496-9302368e4e54";
        const NAMESPACE = "2ciu8";
        const apiUrl = `https://api.testmail.app/api/json?apikey=${APIKEY}&namespace=${NAMESPACE}&pretty=true`;

        try {
          const response = await axios.get(apiUrl);
          const emails = response.data.emails.filter((email) => Date.now() - email.timestamp <= 2 * 60 * 60 * 1000);
          const count = emails.length;
          let msg = `✉️ You have ${count} emails:\n\n`;

          emails.forEach((email) => {
            const subject = email.subject;
            const from = email.from;
            const date = new Date(email.timestamp).toLocaleString("en-US", {
              timeZone: "Asia/Manila"
            });
            const text = email.text || email.html;
            const to = email.to;
            const id = email.id;
            const downloadUrl = email.downloadUrl;
            const attachments = email.attachments;
            let attachmentMsg = "";

            if (attachments.length > 0) {
              attachmentMsg += "\n📎 Attachment:";
              attachments.forEach((attachment) => {
                attachmentMsg += `\n📁 Filename: ${attachment.filename}\n📂 Type: ${attachment.contentType}\n🗂️ Filesize: ${attachment.size}\n⬇️ Download Url: ${attachment.downloadUrl}`;
              });
            }

            msg += `📬 From: ${from}\n✉️ To: ${to}\n📅 Date: ${date}\n📧 Subject: ${subject}\n📜 Message:\n\n${text}${attachmentMsg}\n\n`;
          });

          msg = msg.trim();
          message.reply(msg);
        } catch (error) {
          console.error(error);
          message.reply("❌ Failed to retrieve emails");
        }
        break;
      default:
        return message.reply("Invalid action please type 'help tempmail' on how to use this command.");
      }
    }
  };