const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const chalk = require("chalk");
const figlet = require("figlet");
const projectStart = require("./Assistant.js");
const log = require('./logger/log.js');
const PORT = process.env.PORT || 5000;
const author = require("./json/config.json");
const me = author.admin.author;

app.get("/", (req, res) => {
  res.json(me);
});

app.listen(PORT, () => {
  const txt = `
░▒▓███████▓▒░ ░▒▓██████▓▒░▒▓████████▓▒░ 
░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░     
░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░     
░▒▓███████▓▒░░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░     
░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░     
░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░     
░▒▓███████▓▒░ ░▒▓██████▓▒░  ░▒▓█▓▒░     
  `;

  const gradientColors = ['#FFD700', '#FFA500', '#FF6347'];
  const gradientBot = `${txt}`.split('').map((char, index) => chalk.hex(gradientColors[index % gradientColors.length])(char)).join('');

  console.log(gradientBot);
  console.log(global.utils.line);
  projectStart.assistantStart();
});
