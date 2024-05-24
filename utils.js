const log = require("./logger/log.js");
const fs = require('fs');
const path = require("path");
const mimeDB = require("mime-db");
const axios = require("axios");
const configPath = path.join(__dirname, 'json', 'config.json');
const moment = require("moment-timezone");
const line = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";
//━━━━━━━━━Read Config━━━━━━━━━━//
const configContent = fs.readFileSync(configPath, 'utf-8');
const config = JSON.parse(configContent);
//adminsBot
const adminsBot = config.admin.adminsBot
const API = config.admin.API;
//━━━━━━━━━━━━━━━━━━━//
function getExtFromMimeType(mimeType = "") {
  return mimeDB[mimeType] ? (mimeDB[mimeType].extensions || [])[0] || "unknow": "unknow";
}

function autoRestart() {
  const {
    autoRestartTime
  } = config.assistant;
  if (config.assistant) {
    const time = autoRestartTime;

    if (!isNaN(time) && time > 0) {
      const formattedTime = utils.convertTime(time, true);
      setTimeout(() => {
        console.log("AUTO RESTART", "Restarting...");
        process.exit(2);
      }, time);
      return `Scheduled in: ${formattedTime}`;
    } else if (
      typeof time === "string" &&
      time.match(
        /^((((\d+,)+\d+|(\d+(\/|-|#)\d+)|\d+L?|\*(\/\d+)?|L(-\d+)?|\?|[A-Z]{3}(-[A-Z]{3})?) ?){5,7})$/gim
      )
    ) {
      const cron = require("node-cron");
      cron.schedule(time, () => {
        console.log("AUTO RESTART", "Restarting...");
        process.exit(2);
      });
      return `Scheduled with cron expression: ${time}`;
    }
  }

  return "Auto restart is not configured";
}

function randomString(max, onlyOnce = false, possible) {
  if (!max || isNaN(max))
    max = 10;
  let text = "";
  possible = possible || "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < max; i++) {
    let random = Math.floor(Math.random() * possible.length);
    if (onlyOnce) {
      while (text.includes(possible[random]))
        random = Math.floor(Math.random() * possible.length);
    }
    text += possible[random];
  }
  return text;
}

async function getStreamFromURL(url = "", pathName = "", options = {}) {
  if (!options && typeof pathName === "object") {
    options = pathName;
    pathName = "";
  }
  try {
    if (!url || typeof url !== "string")
      throw new Error(`The first argument (url) must be a string`);
    const response = await axios({
      url,
      method: "GET",
      responseType: "stream",
      ...options
    });
    if (!pathName)
      pathName = utils.randomString(10) + (response.headers["content-type"] ? '.' + utils.getExtFromMimeType(response.headers["content-type"]): ".noext");
    response.data.path = pathName;
    return response.data;
  }
  catch (err) {
    throw err;
  }
}

async function isInRole1(event, api, senderID, threadID) {
  try {
    if (!event.isGroup) return;
    const threadInfo = await api.getThreadInfo(threadID);
    const isAdmin = threadInfo.adminIDs.some(admin => admin.id === senderID.toString());
    return isAdmin;
  } catch (error) {
    console.error(error);
    return false;
  }
}

async function isInRole2(api, senderID) {
  try {
    if (adminsBot.includes(senderID)) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return console.error(error);
  }
}

function convertTime(milliseconds, humanReadable = false) {
  const seconds = milliseconds / 1000;

  if (humanReadable) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const formattedTime = `${hours}h ${minutes}m`;

    return formattedTime;
  } else {
    return seconds;
  }
}

function getUserInfo(api, userID) {
  return new Promise((resolve, reject) => {
    api.getUserInfo(userID, (err, ret) => {
      if (err) {
        reject(err);
      } else {
        resolve(ret[userID]);
      }
    });
  });
}

async function getName(api, userID) {
  let name = "";
  try {
    const userInfo = await getUserInfo(api, userID);
    name = userInfo.name;
  } catch (err) {
    console.error("Error fetching user info:", err);
    return name = "Guest";
  }
  return name;
}

function removeHomeDir(fullPath) {
  if (!fullPath || typeof fullPath !== "string")
    throw new Error('The first argument (fullPath) must be a string');
  while (fullPath.includes(process.cwd()))
    fullPath = fullPath.replace(process.cwd(), "");
  return fullPath;
}

function getTime(timestamps, format) {
  // check if just have timestamps -> format = timestamps
  if (!format && typeof timestamps == 'string') {
    format = timestamps;
    timestamps = undefined;
  }
  return moment(timestamps).tz("Asia/Manila").format(format);
}

function message(api, event) {
  async function sendMessageError(err) {
    if (typeof err === "object" && !err.stack)
      err = utils.removeHomeDir(JSON.stringify(err, null, 2));
    else
      err = utils.removeHomeDir(`${err.name || err.error}: ${err.message}`);
    return await api.sendMessage(utils.getText("utils", "errorOccurred", err), event.threadID, event.messageID);
  }
  return {
    send: async (form, callback) => {
      try {
        return await api.sendMessage(form, event.threadID, callback);
      }
      catch (err) {
        if (JSON.stringify(err).includes('spam')) {
          setErrorUptime();
          throw err;
        }
      }
    },
    reply: async (form, callback) => {
      try {
        return await api.sendMessage(form, event.threadID, callback, event.messageID);
      }
      catch (err) {
        if (JSON.stringify(err).includes('spam')) {
          throw err;
        }
      }
    },
    unsend: async (messageID, callback) => await api.unsendMessage(messageID, callback),
    reaction: async (emoji, messageID, callback) => {
      try {
        return await api.setMessageReaction(emoji, messageID, callback, true);
      }
      catch (err) {
        if (JSON.stringify(err).includes('spam')) {
          throw err;
        }
      }
    },
    err: async (err) => await sendMessageError(err),
    error: async (err) => await sendMessageError(err)
  };
}

async function shortenURL(url) {
  try {
    const result = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
    return result.data;
  }
  catch (err) {
    let error;
    if (err.response) {
      error = new Error();
      Object.assign(error, err.response.data);
    } else
      error = new Error(err.message);
  }
}

function randomString(max, onlyOnce = false, possible) {
  if (!max || isNaN(max))
    max = 10;
  let text = "";
  possible = possible || "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < max; i++) {
    let random = Math.floor(Math.random() * possible.length);
    if (onlyOnce) {
      while (text.includes(possible[random]))
        random = Math.floor(Math.random() * possible.length);
    }
    text += possible[random];
  }
  return text;
}
const utils = {
  log,
  config,
  getExtFromMimeType,
  randomString,
  getStreamFromURL,
  adminsBot,
  isInRole1,
  isInRole2,
  convertTime,
  getUserInfo,
  getName,
  removeHomeDir,
  message,
  randomString,
  shortenURL,
  line,
  autoRestart,
  getTime,
  API,
  configPath
}

module.exports = utils;