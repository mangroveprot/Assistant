const { removeHomeDir, log } = global.utils;

module.exports = {
  config: {
    name: "eval",
    version: "1.5",
    author: "NTKhang",
    cooldown: 5,
    role: 2,
    category: "owner",
  },

  onStart: async function ({ api, args, message }) {
    const cmd = `(async () => { try { ${args.join(" ")} } catch (err) { log.err("eval command", err); message.send("err\\n" + (err.stack ? removeHomeDir(err.stack) : removeHomeDir(JSON.stringify(err, null, 2) || ""))); } })()`;
    eval(cmd);
  }
};