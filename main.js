const Discord = require("discord.js");
const fs = require("fs");
const behaviour = require("./utils/behaviour");
const commands = require("./commands");
const user = require("./user");
const matchmaker = require("./matchmaker");
const exec = require('child_process')
    .exec;
const bot = new Discord.Client();
var botConfig = JSON.parse(fs.readFileSync('config/config.json', 'utf-8'));
var botToken = botConfig.bot_token;
var riotApiKey = botConfig.riot_api_key;
var onReady = false;
if (process.platform === "win32") {
    var rl = require("readline")
        .createInterface({
            input: process.stdin,
            output: process.stdout
        });
    rl.on("SIGINT", function() {
        process.emit("SIGINT");
    });
}
process.on("SIGINT", function() {
    console.log("Disconnecting bot..")
    saveAll();
    process.exit();
});

function saveAll() {
    behaviour.save();
    user.save();
    bot.destroy();
}
bot.on("ready", () => {
    if (onReady) {
        console.log("Reconnected!");
        return;
    }
    console.log('Connected!');
    console.log("Bot name: " + bot.user.username);
    console.log("Bot id: " + bot.user.id);
    behaviour.load();
    commands.load();
    user.load(riotApiKey);
    matchmaker.load();

    // commands.reg("%update", require("./helpers/gitUpdate"), true, "Update the bot");
    onReady = true;
});
bot.on('message', msg => {
    // @TODO Don't process if the message is from a bot

    // @Cleanup just a quick command to check if the bot is online
    if (msg.content == "%ping") {
        msg.channel.send("Pong!");
        return;
    }

    commands.process(msg);
});
bot.login(botToken);