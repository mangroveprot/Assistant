const regExCheckURL = /^(http|https):\/\/[^ "]+$/;
const {
  getName
} = global.utils;
const cheerio = require ('cheerio');
const axios = require ('axios');

module.exports = {
  config: {
    name: "uid",
    version: "1.2",
    description: "Get UID from Facebook users",
    author: "ViLLAVER",
    //Credits To Ntkhang
    cooldown: 5,
    role: 0,
    category: "info",
    usage: "{p}{n} or {n}",
    example: "uid"
  },

  onStart: async function ({
    message, event, args
  }) {
    if (event.messageReply) {
      return message.reply(event.messageReply.senderID);
    }
    if (!args[0])
      return message.reply(event.senderID);
    if (args[0].match(regExCheckURL)) {
      let msg = '';
      for (const link of args) {
        try {

          const uid = await findUid(link);
          const name = await getName(api, uid);
          msg += `${name} => ${uid}\n`;
        }
        catch (e) {
          msg += `${link} (ERROR) => ${e.message}\n`;
        }
      }
      message.reply(msg);
      return;
    }

    let msg = "";
    const {
      mentions
    } = event;
    for (const id in mentions)
      msg += `${mentions[id].replace("@", "")}: ${id}\n`;
    message.reply(msg || "Please tag the person you want to view uid or leave it blank to view your own uid");
  }
};

async function findUid(link) {
  try {
    const response = await axios.post(
      'https://seomagnifier.com/fbid',
      new URLSearchParams({
        'facebook': '1',
        'sitelink': link
      }),
      {
        headers: {
          'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Cookie': 'PHPSESSID=37d29349ba17c8d4309f7741f80ebf43'
        }
      }
    );
    const id = response.data;
    if (isNaN(id)) {
      const html = await axios.get(link);
      const $ = cheerio.load(html.data);
      const el = $('meta[property="al:android:url"]').attr('content');
      if (!el) {
        throw new Error('UID not found');
      }
      const number = el.split('/').pop();
      return number;
    }
    return id;
  } catch (error) {
    console.log(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}