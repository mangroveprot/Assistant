const regExCheckURL = /^(http|https):\/\/[^ "]+$/;
const { getName, API, isInRole2 } = global.utils;
const cheerio = require("cheerio");
const axios = require("axios");

module.exports = {
  config: {
    name: "access",
    version: "1.0",
    description:
      "Get Your Remaining Info Access To API, and add access to the users.",
    author: "ViLLAVER",
    cooldown: 5,
    role: 0,
    category: "info",
    usage:
      "ADD:\n[ {p}{n} or {n} <add> <@mentions>\nReply to the users: {p}{n} or {n} <add> ]\n\n INFO:\nReply to the users: {p}{n} or {n} \n{p}{n} or {n}",
    example: "access add 9999 @Villaver",
  },

  onStart: async function ({ message, event, args, api }) {
    const value = args[1];
    const id = await main(args, api, message, event);
    console.log(id);
    if (!id || id === null) {
      return message.reply("Unexpected error occurred, invalid id.");
    }
    switch (args[0]) {
      case "add":
        const role = await isInRole2(api, event.senderID);
        console.log(role);
        if (!role) {
          return message.reply(
            "You Don't Have Valid Permissions to use this action."
          );
        }
        if (!value || isNaN(value) || value < 0) {
          return message.reply(
            "Please add a valid whole number as the value to add."
          );
        }
        try {
          const addResult = await add(id, value);
          return message.reply(addResult.join("\n"));
        } catch (error) {
          console.error(error);
          return message.reply(`Unexpected error occurred: ${error}`);
        }
      default:
        try {
          const inf = await userAccInf(id);
          return message.reply(inf.join("\n"));
        } catch (error) {
          console.error(error);
          return message.reply(`Unexpected error occurred: ${error}`);
        }
    }
  },
};

async function main(args, api, message, event) {
  if (event.messageReply) {
    return event.messageReply.senderID;
  }
  if (!args[0]) {
    return event.senderID;
  }
  if (args[0].match(regExCheckURL)) {
    for (const link of args) {
      try {
        const uid = await findUid(link);
        return uid;
      } catch (error) {
        console.error(error);
        return null;
      }
    }
  }
  const { mentions } = event;
  const mentionedIds = Object.keys(mentions);
  const uniqueMentions = Array.from(new Set(mentionedIds));

  let id = null;
  if (uniqueMentions.length > 1) {
    id = null;
  } else if (uniqueMentions.length === 1) {
    id = uniqueMentions[0];
  } else {
    id = null;
  }
  return id;
}

async function userAccInf(id) {
  try {
    const response = await axios.get(`${API}/api/get?prompt=getinfo&id=${id}`);
    const res = response.data;
    const output = [`Name: ${res.name}`, `Request Left: ${res.requestLeft}`];
    return output;
  } catch (error) {
    console.error(error);
    throw new Error(`${error}`);
  }
}

async function add(id, value) {
  try {
    const response = await axios.get(
      `${API}/api/add?prompt=add&id=${id}&value=${value}`
    );
    const res = response.data.message;
    const output = [
      `ID: ${id}`,
      `Added Access: ${res.add}`,
      `New Access Left: ${res.requestLeft}`,
    ];
    return output;
  } catch (error) {
    console.error(error);
    throw new Error(`${error}`);
  }
}

async function findUid(link) {
  try {
    const response = await axios.post(
      "https://seomagnifier.com/fbid",
      new URLSearchParams({
        facebook: "1",
        sitelink: link,
      }),
      {
        headers: {
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          Cookie: "PHPSESSID=37d29349ba17c8d4309f7741f80ebf43",
        },
      }
    );
    const id = response.data;
    if (isNaN(id)) {
      const html = await axios.get(link);
      const $ = cheerio.load(html.data);
      const el = $('meta[property="al:android:url"]').attr("content");
      if (!el) {
        throw new Error("UID not found");
      }
      const number = el.split("/").pop();
      return number;
    }
    return id;
  } catch (error) {
    console.log(error);
    throw new Error("An unexpected error occurred. Please try again.");
  }
}
