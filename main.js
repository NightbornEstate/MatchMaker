const Discord = require("discord.js");
const fs = require("fs");

const behaviour = require("./utils/behaviour");
const commands = require("./commands");

const user = require("./user");
const matchmaker = require("./matchmaker");

const bot = new Discord.Client();

var botConfig = JSON.parse(fs.readFileSync('config/config.json', 'utf-8'));
var botToken = botConfig.bot_token;
var riotApiKey = botConfig.riot_api_key;

var onReady = false;

if (process.platform === "win32") {
    var rl = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.on("SIGINT", function() {
        process.emit("SIGINT");
    });
}

process.on("SIGINT", function() {
    console.log("Disconnecting bot..")
    behaviour.save();
    user.save();
    bot.destroy();
    process.exit();
});

bot.on("ready", () => {
    if(onReady){
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

    onReady = true;
});

bot.on('message', msg => {
    // Don't process if the message is from a bot

    if(msg.content == "%ping") {
        msg.channel.send("Pong!");
        return;
    }

    commands.process(msg);
});

bot.login(botToken);