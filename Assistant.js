const fs = require("fs").promises;
const path = require("path");
const express = require("express");
const chalk = require("chalk");

const log = require("./logger/log.js");
const assistant_start = require("./0assistant/login.js");
const { initializeMongoDB } = require("./database/mongoDB.js");
const eventAction = require("./0assistant/handler/eventAction.js");
const utils = require("./utils.js");
const ProgressBar = require("progress");
const { exit } = require("process");

const app = express();
global.utils = utils;
const {
  line,
  message: createFuncMessage,
  autoRestart,
  isInRole1,
  isInRole2,
  adminsBot,
  getUserInfo,
  getName,
  twirlTimer,
} = global.utils;

process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

const appStatePath = path.join(process.cwd(), "json", "appstate.json");
const commandPath = path.join(__dirname, "scripts", "commands");
const eventPath = path.join(__dirname, "scripts", "events");
const configFilePath = path.join(process.cwd(), "json", "config.json");

const commands = {},
  events = {},
  commandCooldowns = new Map(),
  loadedCommands = [],
  loadedEvents = [];
const commandErrors = [],
  eventErrors = [];

async function loadCommandsEvents() {
  try {
    const totalFiles =
      (await fs.readdir(commandPath)).length +
      (await fs.readdir(eventPath)).length;
    const bar = new ProgressBar(
      chalk.bold.greenBright("Loading: :bar") + " :percent :etas",
      {
        total: totalFiles,
        width: 10,
        complete: "█",
        incomplete: " ",
        renderThrottle: 1,
      }
    );

    await loadFiles(commandPath, commands, commandErrors, loadedCommands, bar);
    await loadFiles(eventPath, events, eventErrors, loadedEvents, bar);
    process.stdout.write("\u001b[1A\u001b[K");
    console.log(
      chalk.bold.green(`\nCommands Loaded: ${loadedCommands.length}`)
    );
    console.log(`[ ${loadedCommands.join(", ")} ]`);
    console.log(chalk.bold.green(`\nEvents Loaded: ${loadedEvents.length}`));
    console.log(`[ ${loadedEvents.join(", ")} ]`);

    [commandErrors, eventErrors].forEach((errorsArray, isCommandError) => {
      if (errorsArray.length > 0) {
        console.log(
          chalk.red(
            `WARN-${isCommandError ? "EVENT" : "COMMAND"}: ${
              errorsArray.length
            } file${
              errorsArray.length === 1 ? "" : "s"
            } could not be integrated:`
          )
        );
        errorsArray.forEach(({ fileName, error }) => {
          console.log(`Error detected in file: ${fileName}`);
          if (error instanceof SyntaxError) {
            console.log("Syntax error occurred:", error.message);
            console.log("Stack trace:", error.stack);
          } else if (error.stack) {
            const lineNumber = error.stack
              .split("\n")[1]
              .match(/:(\d+):\d+\)$/)[1];
            console.log(`Reason: ${error}`);
            console.log(chalk.red(`Line: ${lineNumber}`));
          }
        });
        console.log();
      }
    });
  } catch (error) {
    log.err(error);
  }
}

async function loadFiles(
  filePath,
  container,
  errorContainer,
  loadedContainer,
  bar
) {
  const files = await fs.readdir(filePath);
  const delay = 100;
  for (const file of files) {
    const name = path.basename(file, ".js");
    try {
      container[name] = require(path.join(filePath, file));
      loadedContainer.push(file);
    } catch (error) {
      errorContainer.push({
        fileName: file,
        error,
      });
    }
    bar.tick();
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

async function connectToMongoDB() {
  const twirlTimerId = twirlTimer("Initializing, please wait... ");
  try {
    await initializeMongoDB();
    clearInterval(twirlTimerId);
    process.stdout.write("\r ");
    log.success("Connected to MongoDB!");
  } catch (error) {
    clearInterval(twirlTimerId);
    process.stdout.write("\r ");
    log.error(error.message);
    process.exit(1);
  }
}

async function assistantStart() {
  //Load the commands and events
  await loadCommandsEvents();

  // Connecting to the database

  console.log(chalk.bold.green(`\nInitialized MongoDB`));
  await connectToMongoDB();

  //
  try {
    const fileContent = await fs.readFile(configFilePath, "utf8");
    const config = JSON.parse(fileContent);

    if (!config || !config.settings) {
      throw new Error(`Can't find config.json at ${configFilePath}.`);
    }

    const {
      listenEvents,
      selfListen,
      autoMarkRead,
      autoMarkDelivery,
      forceLogin,
    } = config.settings;
    const { hasPrefix, prefix } = config.assistant;

    // Initializing the bot
    assistant_start(async (err, api) => {
      if (err) {
        log.error(`${err}`);
        return;
      }

      const id = api.getCurrentUserID();
      const accountName = await getName(api, id);
      const botPrefix = hasPrefix ? prefix : "No Prefix";
      const admins = await Promise.all(
        adminsBot.map(async (adminId) => {
          try {
            const adminInfo = await getUserInfo(api, adminId);
            return adminInfo.name;
          } catch (error) {
            console.error(error);
            return null;
          }
        })
      );

      //Logging necessary bot information
      log.info("LOG-IN AS", `${accountName}`);
      log.info("PREFIX", `${botPrefix}`);
      log.info("Admins", `${admins.filter((admin) => admin).join(", ")}`);

      try {
        const restart = autoRestart();
        log.info("AUTO-RESTART", `${restart}`);
      } catch (error) {
        log.err("AUTO-RESTART", error);
      }

      console.log(line);

      // Sets various configurable options for the api.
      api.setOptions({
        listenEvents,
        selfListen,
        autoMarkRead,
        autoMarkDelivery,
        forceLogin,
      });

      //Listen for events and new data recieve from the api and proccess
      api.listenMqtt(async (err, event) => {
        try {
          if (err) {
            throw new Error("Error in MQTT listener:", err, api);
          }

          const message = createFuncMessage(api, event);
          eventAction.handleEvent(adminsBot, api, event);

          //Check if has prefix
          const pfx = hasPrefix ? prefix : "";

          //check the message if starts with prefix
          if (event.body && event.body.toLowerCase().startsWith("prefix")) {
            const output = [
              "┌────[🪶]────⦿",
              `│✨ My Prefix: ${botPrefix}`,
              `│ ⸦•⸧ Type "${pfx}help" to show all my available commands.`,
              "└────────⦿",
            ];
            return message.reply(output.join("\n"));
          }

          let command, args, commandName;
          const { senderID, threadID, body } = event;

          //Check if the scripts commands and events has a onstart
          for (const eventName of Object.keys(events)) {
            try {
              const eventHandler = events[eventName];
              if (
                eventHandler.onStart &&
                typeof eventHandler.onStart === "function"
              ) {
                await eventHandler.onStart({
                  message,
                  event,
                  api,
                });
              } else {
                console.log(
                  `No onStart function found or onStart is not a function for: ${eventName}`
                );
              }
            } catch (error) {
              console.error(`⚠️ Events |  '${eventName}':`, error);
            }
          }

          if (
            (event.type === "message" || event.type === "message_reply") &&
            body
          ) {
            //Check if the message starts with the prefix
            if (
              hasPrefix &&
              event.body &&
              event.body.toLowerCase().startsWith(prefix)
            ) {
              //HAS PREFIX

              //slice the messages and the first args is command name the rest is input
              [command, ...args] = event.body
                .slice(prefix.length)
                .trim()
                .split(/\s+/);
              const cmds = command.toLowerCase();

              //Find if the command from the events is exist
              commandName = Object.keys(commands).find(
                (name) =>
                  commands[name].config && commands[name].config.name === cmds
              );

              //return this If the command is not exist
              if (!commandName) {
                api.sendMessage(
                  `⚠️ Command not found please type "${pfx}help" to show available commands!`,
                  event.threadID,
                  event.messageID
                );
                return;
              }
            } else if (!hasPrefix && event.body) {
              //NO PREFIX

              //slice the messages and the first args is command name the rest is input
              [command, ...args] = event.body.trim().split(/\s+/);
              const cmds = command.toLowerCase();

              //Find if the command from the events is exist
              commandName = Object.keys(commands).find(
                (name) =>
                  commands[name].config && commands[name].config.name === cmds
              );

              //If not exist then no actions
              if (!commandName) {
                return;
              }
            }

            //If the command is exist check the role of the users if eligibility
            if (commandName) {
              const requiredRole = commands[commandName].config.role;
              if (![0, 1, 2].includes(requiredRole)) {
                return api.sendMessage(
                  "❗ | This command requires a valid role, not type of string or object. Use 0 for everyone, 1 for box and bot admin, and 2 for bot admin.",
                  threadID
                );
              }
              const isBoxOrBotAdmin =
                (await utils.isInRole1(event, api, senderID, threadID)) ||
                (await utils.isInRole2(api, senderID));

              const isBotAdmin = await utils.isInRole2(api, senderID);

              switch (requiredRole) {
                case ROLE_EVERYONE:
                  // Everyone
                  break;
                case ROLE_BOX_AND_BOT_ADMIN:
                  // Box and Bot Admin
                  if (!isBoxOrBotAdmin) {
                    return api.sendMessage(
                      "❗ | Only Box and Bot Admin To Use This Command.",
                      event.threadID,
                      event.messageID
                    );
                  }
                  break;
                case ROLE_BOT_ADMIN:
                  // Bot Admin
                  if (!isBotAdmin) {
                    return api.sendMessage(
                      "❗ | Only Bot Admin To Use This Command.",
                      event.threadID,
                      event.messageID
                    );
                  }
                  break;
                default:
                  return api.sendMessage(
                    `Command ${commandName} no valid role included in config.`,
                    event.threadID,
                    event.messageID
                  );
              }

              //Get the cooldown time of the commands
              const cooldownTime = commands[commandName].config.cooldown;

              //check if the cooldown time is integers
              if (!isNaN(cooldownTime) && cooldownTime < 0) {
                api.sendMessage(
                  "Cooldown must be integers not type of string or object.",
                  threadID
                );
                log.error(
                  "Cooldown must be integers not type of string or object."
                );
                return;
              }
              if (!cooldownTime) {
                api.sendMessage(
                  "Config on this command must include a valid cooldown.",
                  threadID
                );
                return;
              }
              const userCooldownKey = `${senderID}_${commandName}`;
              const userCooldown = commandCooldowns.get(userCooldownKey);
              if (userCooldown && userCooldown > Date.now()) {
                const remainingCooldown = Math.ceil(
                  (userCooldown - Date.now()) / 1000
                );
                api.sendMessage(
                  `Command on cooldown. Remaining cooldown: ${remainingCooldown} seconds.`,
                  threadID
                );
                return;
              }
              commandCooldowns.set(
                userCooldownKey,
                Date.now() + cooldownTime * 1000
              );
              //
              api.sendTypingIndicator(threadID);
              try {
                if (commands[commandName].onStart) {
                  api.getUserInfo(senderID, (err, ret) => {
                    if (err) {
                      console.error(err);
                      return;
                    }
                    const senderName = ret[senderID].name;
                    log.info(
                      "CALL-COMMAND",
                      `${commandName} | ${senderName} | ${senderID} | ${threadID} |\n${body}`
                    );
                  });
                  await commands[commandName].onStart({
                    api,
                    event,
                    args,
                    message,
                  });
                } else {
                  api.sendMessage(
                    "Command does not have onStart method.",
                    threadID
                  );
                }
              } catch (error) {
                const errorDetails = error.stack
                  .split("\n")
                  .slice(0, 3)
                  .join("\n");
                api.sendMessage(
                  `Error in command '${commandName}': ${errorDetails}`,
                  threadID
                );
                log.error(error);
              }
            }
          }
        } catch (error) {
          log.error(error);
        }
      });
    });
  } catch (error) {
    log.error(error);
  }
}

module.exports = {
  assistantStart,
};
