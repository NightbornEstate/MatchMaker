const discord = require("discord.js");
const behaviour = require("./utils/behaviour");
var Message = discord.Message;
var Commands = [];
const MAX_MSG_LEN = 2000;
module.exports = {
  load: function () {
    this.reg("%block", behaviour.block_output, true, "blocks the output of the current channel");
    this.reg("%unblock", behaviour.unblock_output, true, "unblocks the output of the current channel");
  },
  /**
   * @param {String} sig
   * @param {Function} func
   * @param {Integer} perms
   * @param {String} desc
   * */
  reg: function (sig, func, perms, desc) {
    Commands.push({
      signature: sig,
      function: func,
      permissions: perms,
      description: desc
    });
  },
  /**
   * @param {Message} msg
   */
  process: function (msg) {
    let content = msg.content.toLowerCase();
    let member = msg.guild.members.find("id", msg.author.id);
    for (i in Commands) {
      let cmd = Commands[i];
      if (content.startsWith(cmd.signature)) {
        // if not admin check for roles
        if (!member.hasPermission("ADMINISTRATOR")) {
          // if roles is not an array it means only admins can use the command
          if (Array.isArray(cmd.permissions)) {
            // search if has one of the roles
            let found = false;
            for (let i = 0; i < cmd.permissions.length; i++) {
              if (member.roles.find("id", cmd.permissions[i])) {
                found = true;
                break;
              }
            }
            found = found || cmd.permissions.length == 0;
            if (!found) {
              msg.reply("You don't have one of the required roles");
              return;
            }
          } else {
            // if true only admins are allowed to use the commands
            if (cmd.permissions === true) {
              msg.reply("Only admins can use this command");
              return;
            }
            // otherwise it has no restrictions
          }
          // don't allow on blocked channels
          if (behaviour.is_output_blocked(msg) && !r) return;
        }
        try {
          // run the command, log if error
          return cmd.function(msg);
        } catch (e) {
          console.log(e);
        }
        return;
      }
    }
  }
}
