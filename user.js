const discord = require("discord.js");
const fs = require("fs");
const commands = require("./commands");
const riotApi = require("riot-api-nodejs");
var Message = discord.Message;
var TextChannel = discord.TextChannel;
var GuildMember = discord.GuildMember;
var Guild = discord.Guild;
var user_data = {};
const FILE_PATH = "user_data.json";
var ClassicAPI = riotApi.ClassicAPI;
/**
 * @type {ClassicAPI}
 */
var API = null;
const RANK_UNRANCKED = -1;
const RANK_BRONZE = 0;
const RANK_SILVER = 1;
const RANK_GOLD = 2;
const RANK_PLATINUM = 3;
const RANK_DIAMOND = 4;
const RANK_MASTER = 5;
const RANK_C = 6;
const RANK_NAME_UNRANCKED = "Wood";
const RANK_NAME_BRONZE = "Bronze";
const RANK_NAME_SILVER = "Silver";
const RANK_NAME_GOLD = "Gold";
const RANK_NAME_PLATINUM = "Platinum";
const RANK_NAME_DIAMOND = "Diamond";
const RANK_NAME_MASTER = "Master";
const RANK_NAME_C = "Challenger";
const COLOR_UNRANCKED = 0x995E40; // #995E40
const COLOR_BRONZE = 0x7E7F3D; // #7E7F3D
const COLOR_SILVER = 0x808080; // #808080
const COLOR_GOLD = 0xFECA12; // #FECA12
const COLOR_PLATINUM = 0x008240; // #008240
const COLOR_DIAMOND = 0x9CD9EC; // #9CD9EC
const COLOR_MASTER = 0xFF801C; // #FF801C
const COLOR_C = 0xFF801C; // #FF801C
const RANK_ICON_UNRANCKED = "https://ih0.redbubble.net/image.249430386.8898/flat,800x800,075,f.jpg";
const RANK_ICON_BRONZE = "https://www.lol-smurfs.com/blog/wp-content/uploads/2017/01/bronzei.png";
const RANK_ICON_SILVER = "https://www.lol-smurfs.com/blog/wp-content/uploads/2017/01/1_3.png";
const RANK_ICON_GOLD = "https://www.lol-smurfs.com/blog/wp-content/uploads/2017/01/goldv.png";
const RANK_ICON_PLATINUM = "https://www.lol-smurfs.com/blog/wp-content/uploads/2017/01/platinumv.png";
const RANK_ICON_DIAMOND = "https://www.lol-smurfs.com/blog/wp-content/uploads/2017/01/diamondi.png";
const RANK_ICON_MASTER = "https://www.lol-smurfs.com/blog/wp-content/uploads/2017/01/master.png";
const RANK_ICON_C = "https://www.lol-smurfs.com/blog/wp-content/uploads/2017/01/challenger.png";
/**
 * @param {GuildMember} author
 * @param {TextChannel} channel
 */
function print_profile(author, channel) {
  let name = author.user.username;
  if (typeof author.nickname != 'undefined' && author.nickname != null) {
    name = author.nickname;
  }
  let rank, rankNumber, description, ign;
  if (API) {
    // get from servers
  } else {
    // display saved
    if (user_data[author.id]) {
      ign = user_data[author.id].ign;
      rank = user_data[author.id].rank;
      rankNumber = user_data[author.id].rankNumber;
      description = "Some cool stats!";
    } else {
      if (API) {
        description = "Use the `%ign <ign>` command to set your profile";
      } else {
        description = "Use the `%ign <ign> <rank>` command to set your profile";
      }
    }
  }
  let embed = new discord.RichEmbed();
  let rankIcon, rankColor, rankName;
  switch (rank) {
    case RANK_BRONZE:
      rankIcon = RANK_ICON_BRONZE;
      rankName = RANK_NAME_BRONZE;
      rankColor = COLOR_BRONZE;
      break;
    case RANK_SILVER:
      rankIcon = RANK_ICON_SILVER;
      rankName = RANK_NAME_SILVER;
      rankColor = COLOR_SILVER;
      break;
    case RANK_GOLD:
      rankIcon = RANK_ICON_GOLD;
      rankName = RANK_NAME_GOLD;
      rankColor = COLOR_GOLD;
      break;
    case RANK_PLATINUM:
      rankIcon = RANK_ICON_PLATINUM;
      rankName = RANK_NAME_PLATINUM;
      rankColor = COLOR_PLATINUM;
      break;
    case RANK_DIAMOND:
      rankIcon = RANK_ICON_DIAMOND;
      rankName = RANK_NAME_DIAMOND;
      rankColor = COLOR_DIAMOND;
      break;
    case RANK_MASTER:
      rankIcon = RANK_ICON_MASTER;
      rankName = RANK_NAME_MASTER;
      rankColor = COLOR_MASTER;
      break;
    case RANK_C:
      rankIcon = RANK_ICON_C;
      rankName = RANK_NAME_C;
      rankColor = COLOR_C;
      break;
    case RANK_UNRANCKED:
      rankIcon = RANK_ICON_UNRANCKED;
      rankName = RANK_NAME_UNRANCKED;
      rankColor = COLOR_UNRANCKED;
      break;
    default:
      rankName = null;
      rankColor = 0x000000; //#000000
      rankIcon = null;
      break;
  }
  if (ign) {
    name = ign + " (@" + name + ")";
  }
  embed.setDescription(description);
  embed.setThumbnail(author.user.displayAvatarURL);
  if (rankIcon == null) embed.setAuthor("Member");
  else embed.setAuthor(rankName + " " + rankNumber, rankIcon);
  embed.setTitle(name);
  embed.setColor(rankColor);
  channel.send(embed);
}
/**
 * @param {Message} msg
 */
function profile(msg) {
  if (msg.content.trim()
    .toLowerCase() == "%profile") {
    let member = msg.guild.members.find("id", msg.author.id);
    if (!member) {
      return;
    }
    print_profile(member, msg.channel);
  } else {
    if (msg.mentions.members.array()
      .length > 0) {
      let data = user_data[msg.mentions.members.first()];
      print_profile(msg.mentions.members.first(), msg.channel);
    }
  }
}
/**
 * @param {Message} msg
 */
function ign(msg) {
  let tokens = msg.content.split(" ");
  if (API) {
    // verify with server

    /* This is not working right now */

    API.getSummonerByName(tokens[1])
      .then((summoner) => {
        if (!user_data[msg.author.id]) {
          user_data[msg.author.id] = {};
        }
        let level = summoner.summonerLevel;
        user_data[msg.author.id].ign = tokens[1];
        user_data[msg.author.id].rank = 0;
        user_data[msg.author.id].rankNumber = 0;
        module.exports.save();
        msg.reply("Done!");
      })
      .catch((err) => {
        msg.reply("Could not find that user (region: NA)");
      });
  } else {
    // will manually get from user
    if (tokens.length < 2) {
      msg.reply("Usage: `%ign <ign> <rank name><rank number>`, rank name can be b/s/g/d/p/m/c and number can be from 1-5");
      return;
    }
    let name = "";
    for (let i = 1; i < tokens.length - 1; i++) {
      name += " " + tokens[i];
    }
    let lastToken = tokens[tokens.length - 1];
    let rankName, rankNumber;
    let rank = lastToken.toLowerCase();
    let frm_sn = /(b|s|g|d|p|c|m)([0-5])/g;
    let match = frm_sn.exec(rank);
    if (!match) {
      name = "";
      for (let i = 1; i < tokens.length; i++) {
        name += " " + tokens[i];
      }
      user_data[msg.author.id].ign = name;
      user_data[msg.author.id].rank = RANK_UNRANCKED;
      user_data[msg.author.id].rankNumber = 5;
      module.exports.save();
      msg.reply("Done!");
      return;
    }
    rankName = match[1].toLowerCase();
    switch (rankName) {
      case "b":
        rankName = RANK_BRONZE;
        break;
      case "s":
        rankName = RANK_SILVER;
        break;
      case "g":
        rankName = RANK_GOLD;
        break;
      case "d":
        rankName = RANK_DIAMOND;
        break;
      case "p":
        rankName = RANK_PLATINUM;
        break;
      case "m":
        rankName = RANK_MASTER;
        break;
      case "c":
        rankName = RANK_C;
        break;
      default:
        msg.reply("Invalid rank " + rankName);
        return;
    }
    rankNumber = match[2];
    if (!rankNumber) {
      msg.reply("Usage: `%ign <ign> <rank name><rank number>`, rank name can be b/s/g/d/p/m/c and number can be from 1-5");
      return;
    } else {
      rankNumber = parseInt(rankNumber);
    }
    if (rankNumber <= 0 || rankNumber > 5 || (rankName == RANK_C && rankNumber != 1)) {
      msg.reply("Invalid rank number " + rankNumber);
      return;
    }
    if (!user_data[msg.author.id]) {
      user_data[msg.author.id] = {};
    }
    user_data[msg.author.id].ign = name;
    user_data[msg.author.id].rank = rankName;
    user_data[msg.author.id].rankNumber = rankNumber;
    module.exports.save();
    msg.reply("Done!");
  }
}
module.exports = {
  load: function (apiKey) {
    if (apiKey) {
      API = new riotApi.ClassicAPI([apiKey], riotApi.region_e.EUW);
    }
    commands.reg("%profile", profile, false, "View profile info");
    commands.reg("%ign", ign, false, "Set in-game name");
    if (fs.existsSync(FILE_PATH)) {
      user_data = JSON.parse(fs.readFileSync(FILE_PATH));
    }
  },
  save: function () {
    fs.writeFileSync(FILE_PATH, JSON.stringify(user_data));
  },
  getUserData: function (member) {
    if (!member) {
      return user_data;
    }
    return user_data[member.id];
  },
  getRank: function (rank) {
    switch (rank) {
      case RANK_BRONZE:
        return RANK_NAME_BRONZE;
      case RANK_SILVER:
        return RANK_NAME_SILVER;
      case RANK_GOLD:
        return RANK_NAME_GOLD;
      case RANK_PLATINUM:
        return RANK_NAME_PLATINUM;
      case RANK_DIAMOND:
        return RANK_NAME_DIAMOND;
      case RANK_MASTER:
        return RANK_NAME_MASTER;
      case RANK_C:
        return RANK_NAME_C;
      case RANK_UNRANCKED:
        return RANK_NAME_UNRANCKED;
      default:
        return null;
    }
  }
};