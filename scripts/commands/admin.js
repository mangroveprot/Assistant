const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "admin",
    description: "Displays a list of admins or manages admins.",
    usage:
      "{p}/{n} <actions>\n Actions: add/list/remove>\nadd <uid>\nlist\nremove <uid>",
    example: "admin add 123344\nadmin list\nadmin remove 123344",
    author: "VɪLLAVER",
    role: 0,
    cooldown: 5,
  },

  onStart: async ({ api, event, args, message }) => {
    const prompt = args.join(" ");
    const [acts, userID] = prompt.trim().split(/\s+/);
    const action = acts.toLowerCase();

    const parsedUserID = parseInt(userID, 10);
    if (userID) {
      if (!Number.isInteger(parsedUserID)) {
        return message.reply(
          "⚠️ | UserID must be an integer, not a string or object"
        );
      }
    }
    const configData = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "..", "..", "json", "config.json"),
        "utf8"
      )
    );
    const adminsBot = configData.admin.adminsBot;

    if (!adminsBot.includes(event.senderID)) {
      return message.reply("You do not have permission to use this command.");
    }

    if (action === "add") {
      if (!userID) {
        return message.reply("No UserID.");
      }
      addAdmin(api, event, parseInt(userID, 10), message);
    } else if (action === "remove") {
      removeAdmin(api, event, parseInt(userID, 10), message);
    } else if (action === "list") {
      listAdmins(api, event, message);
    } else {
      return message.reply(
        "Invalid Action please type 'help admin' to show its usage."
      );
    }
  },
};

function loadAdmins() {
  try {
    const configData = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "..", "..", "json", "config.json"),
        "utf8"
      )
    );
    return configData || {};
  } catch (error) {
    console.error("Error loading configuration:", error);
    return {};
  }
}

function saveAdmins(admins) {
  try {
    const configData = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "..", "..", "json", "config.json"),
        "utf8"
      )
    );
    configData.admin.admins = admins;
    fs.writeFileSync(
      path.join(__dirname, "..", "..", "json", "config.json"),
      JSON.stringify(configData, null, 2)
    );
  } catch (error) {
    console.error("Error saving admin list:", error);
  }
}

function addAdmin(api, event, userID) {
  let configData = loadAdmins();

  // Convert userID to string
  const userIDString = userID.toString();

  if (!configData.admin.adminBot.includes(userIDString)) {
    configData.admin.adminBot.push(userIDString);
    saveConfig(configData);
    api.sendMessage(
      `Admin with ID ${userIDString} has been added to adminBot.`,
      event.threadID
    );
  } else {
    api.sendMessage(
      `User with ID ${userIDString} is already in adminBot.`,
      event.threadID
    );
  }
}

function saveConfig(configData) {
  try {
    fs.writeFileSync(
      path.join(__dirname, "..", "..", "json", "config.json"),
      JSON.stringify(configData, null, 2)
    );
  } catch (error) {
    console.error("Error saving configuration:", error);
  }
}

function removeAdmin(api, event, userID) {
  let configData = loadAdmins();

  if (!Array.isArray(configData.admin.adminBot)) {
    api.sendMessage("Error loading admin list.", event.threadID);
    return;
  }

  const index = configData.admin.adminBot.indexOf(userID.toString());

  if (index !== -1) {
    configData.admin.adminBot.splice(index, 1);
    saveConfig(configData);
    api.sendMessage(
      `Admin with ID ${userID} has been removed.`,
      event.threadID
    );
  } else {
    api.sendMessage(`User with ID ${userID} is not an admin.`, event.threadID);
  }
}

function listAdmins(api, event) {
  const configData = loadAdmins();
  const adminBotList = configData.admin.adminBot;

  if (adminBotList.length > 0) {
    const adminList = adminBotList
      .map((adminID) => `AdminBot ID: ${adminID}`)
      .join("\n");
    api.sendMessage(`List of adminBot IDs:\n${adminList}`, event.threadID);
  } else {
    api.sendMessage("No adminBot IDs found.", event.threadID);
  }
}
