const exec = require('child_process')
  .exec;
const {promisify} = require('util');
const execPromise = promisify(exec);
const Discord = require("discord.js");

module.exports = async() => {
  var output = 
    new Discord.RichEmbed()
    .setTitle("Git Restart")
    .setDescription("Pulling from Git and restarting the bot.")
    .setColor(0x36393e);
  var m = await msg.channel.send(output);
  var git = await execPromise("git pull");
  git.stdout ? output.addField("Git stdout", `\`\`\`${git.stdout}\`\`\``) : ""
  git.stderr ? output.addField("Git stderr", `\`\`\`${git.stderr}\`\`\``) : ""
  output.setDescription("Pulled from git, going down now o/")
  await m.edit(output);
  await execPromise("pm2 restart matchmaker");
}