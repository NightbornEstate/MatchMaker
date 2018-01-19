const discord = require("discord.js");
const fs = require("fs");
var Message = discord.Message;
var BEHAVIOUR_LOCATION = "config/behaviour.json";
var bOutChannels = [];
module.exports = {
  load: function () {
    if (fs.existsSync(BEHAVIOUR_LOCATION)) {
      let data = JSON.parse(fs.readFileSync(BEHAVIOUR_LOCATION));
      bOutChannels = data.output_block_channels;
    }
  },
  save: function () {
    let data = {
      "output_block_channels": bOutChannels
    };
    fs.writeFileSync(BEHAVIOUR_LOCATION, JSON.stringify(data));
  },
  /**
   * @param {Message} msg
   */
  unblock_output: function (msg) {
    if (!bOutChannels[msg.channel.id]) {
      msg.channel.send("Channel already unblocked!");
      return;
    }
    delete bOutChannels[msg.channel.id];
    msg.channel.send("Channel unblocked.");
    module.exports.save();
  },
  /**
   * @param {Message} msg
   */
  block_output: function (msg) {
    if (bOutChannels[msg.channel.id]) {
      msg.channel.send("Channel already blocked!");
      return;
    }
    bOutChannels[msg.channel.id] = true;
    msg.channel.send("Channel has been blocked");
    module.exports.save();
  },
  /**
   * @param {Message} msg
   */
  is_output_blocked: function (msg) {
    return bOutChannels[msg.channel.id] == true;
  }
}
