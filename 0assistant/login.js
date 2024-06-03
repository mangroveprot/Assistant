const login = require("fca-unofficial");
const fs = require('fs');
const path = require('path');
const appStatePath = path.join(process.cwd(), "json", "appstate.json");
const log = require(path.join(process.cwd(), 'logger', 'log.js'));
const configFilePath = path.join(process.cwd(), "json", "config.json");
const chalk = require('chalk');
function loadAppState() {
  try {
    const appState = JSON.parse(fs.readFileSync(appStatePath, "utf8"));

    if (Object.keys(appState).length === 0) {
      log.error(`Please add your app state at ${appStatePath}`);
      process.exit();
    }

    return appState;
  } catch (error) {
    log.error(`${error}`);
    if (error instanceof SyntaxError) {
      log.error(`App state must be in JSON format. Please check your app state in ${appStatePath}`);
    }
    process.exit();
  }
}

function assistantStart(callback) {
  const fileContent = fs.readFileSync(configFilePath, "utf8");
  const config = JSON.parse(fileContent);

  if (!config || !config.settings) {
    throw new Error(`Can't find config.json at ${configFilePath}.`);
  }
  const {
    GitHub,
    Facebook
  } = config.createdBy;

  if (GitHub !== "https:github.com/mangroveprot" && Facebook !== "www.facebook.com/gerald.c.villaver") {
    return log.error("NOT-AUTHORIZED", `Please don't change anything in json/config.json at the 'createdBy' field. This result in the loss of my ownership stamp.`);
    process.exit();
  }
  const developer = config.admin.author;
  const line = global.utils.line;
  console.log(line);
  console.log(`\n©Developed by ${developer} | 2024`);
  console.log(chalk.greenBright("MESSAGE:"), `If you have any questions or suggestions regarding to my works don't hesitate to contact me.`);
  console.log(`GitHUB - ${chalk.greenBright(`${GitHub}`)}`);
  console.log(`Facebook - ${chalk.greenBright(`${Facebook}`)}`);
  console.log(chalk.redBright(`⚠️ This Bot Is Not For Sale!\n`));
  console.log(line);

  login({
    appState: loadAppState()
  }, (err, api) => {
    if (err) {
      console.error(err);
      callback(err, null);
      return;
    }
    callback(null, api);
  });
}

module.exports = assistantStart;