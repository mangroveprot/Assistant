const axios = require("axios");
const qs = require("qs");
const cheerio = require("cheerio");
const {
  getStreamFromURL,
  shortenURL,
  randomString
} = global.utils;

module.exports = {
  config: {
    name: "tiktok",
    version: "1.8",
    author: "NTKhang",
    cooldown: 5,
    role: 0,
    category: "media",
    description: "   {pn} [video|-v|v] <url>: use to download video/slide (image) from tiktok link."
    + "\n   {pn} [audio|-a|a] <url>: use to download audio from tiktok link"
  },

  onStart: async function ({
    args, message
  }) {
    const messageErrorInvalidUrl = 'It seems that TikTok is changed something on their website, so we are not able to reach their data. Please wait for 5 minutes and try to request your link again. We are looking into this issue.';

    switch (args[0]) {
      case "video":
      case "-v":
      case "v": {
          if (!(args[1] || "").trim().match(/^http(s|):\/\/.*(tiktok)\.com.*\/.*$/gi))
            return message.reply("Invalid URL");

          const data = await query(args[1]);
          if (data.status == 'error') {
            if (data.message == messageErrorInvalidUrl)
              return message.reply("Invalid URL");
            else
              return message.reply("An error occurred: " + JSON.stringify(data, null, 2));
          }

          const msgSend = await message.reply("Downloading video: " + data.title);
          const linksNoWatermark = data.downloadUrls;
          if (!linksNoWatermark)
            return message.reply("Please try again.");

          if (Array.isArray(linksNoWatermark)) {
            console.log(linksNoWatermark);
            const allStreamImage = await Promise.all(linksNoWatermark.map(link => getStreamFromURL(link, `${randomString(10)}.jpg`)));
            const allImageShortUrl = await Promise.all(linksNoWatermark.map((link, index) => shortenURL(link)
              .then(shortUrl => `${index + 1}: ${shortUrl}`)
            ));
            await message.reply({
              body: `Downloaded slide: ${data.title}\n${allImageShortUrl.join('\n')}`,
              attachment: allStreamImage
            });
            await message.unsend((await msgSend).messageID);
            return;
          }

          const streamFile = await getStreamFromURL(linksNoWatermark, 'video.mp4');
          await message.reply({
            body: `Downloaded video: ${data.title}\n${await shortenURL(linksNoWatermark)}`,
            attachment: streamFile
          });
          await message.unsend((await msgSend).messageID);
          break;
        }
      case "audio":
      case "a":
      case "-a": {
          if (!(args[1] || "").trim().match(/^http(s|):\/\/.*(tiktok)\.com.*\/.*$/gi))
            return message.reply(getLang("invalidUrl"));
          const dataAudio = await query(args[1], true);
          if (dataAudio.status == 'error') {
            if (dataAudio.message == messageErrorInvalidUrl)
              return message.reply("Invalid URL");
            else
              return message.reply(dataAudio.message);
          }

          const urlAudio = dataAudio.downloadUrls;
          const audioName = dataAudio.title;
          if (!urlAudio)
            return message.reply("Please Try Agian");
          const msgSendAudio = message.reply("Downloading video: " + audioName);

          const streamFileAudio = await getStreamFromURL(urlAudio, "audio.mp3");
          message.reply({
            body: `Downloaded audio ${audioName}`,
            attachment: streamFileAudio
          }, async () => message.unsend((await msgSendAudio).messageID));
          break;
        }
      default: {
          message.reply("Invalid actions (second argument), must include video or audio");
        }
    }
  }
};

async function query(url, isMp3 = false) {
  const res = await axios.get("https://ssstik.io/en");
  const tt = res.data.split(`s_tt = '`)[1].split(`',`)[0];
  const {
    data: result
  } = await axios({
      url: "https://ssstik.io/abc?url=dl",
      method: "POST",
      data: qs.stringify({
        id: url,
        locale: 'en',
        tt
      }),
      "headers": {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36 Edg/105.0.1343.33"
    }
  });

const $ = cheerio.load(result);
if (result.includes('<div class="is-icon b-box warning">'))
  throw {
  status: "error",
  message: $('p').text()
};

const allUrls = $('.result_overlay_buttons > a');
const format = {
  status: 'success',
  title: $('.maintext').text()
};

const slide = $(".slide");
if (slide.length != 0) {
  const url = [];
  slide.each((index, element) => {
    url.push($(element).attr('href'));
  });
  format.downloadUrls = url;
  return format;
}
format.downloadUrls = $(allUrls[isMp3 ? allUrls.length - 1: 0]).attr('href');
return format;
}