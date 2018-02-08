const discord = require("discord.js");
const commands = require("./commands");
const user = require("./user");
var Message = discord.Message;
var TextChannel = discord.TextChannel;
var GuildMember = discord.GuildMember;
var Guild = discord.Guild;
/**
 * @typedef {{name: string, description: string, host: GuildMember, players: GuildMember[], teamA: GuildMember[], teamB: GuildMember[], positions: number, originalMsg: Message}} Game
 */
/**
 * @type {Game[]}
 */
var games = {};
/**
 * @param {GuildMember} author 
 */
function getUsername(author) {
    let name = author.user.username;
    if (typeof author.nickname != 'undefined' && author.nickname != null) {
        name = author.nickname;
    }
    return name;
}
const EMBED_NEUTRAL = 0x36393e; // #36393e

const GAME_STATUS_WAITING = 0;
const GAME_STATUS_STARTED = 1;
const GAME_STATUS_PENDING = 2;
const GAME_STATUS_ENDED = 3;

const EVENT_ORGANIZER_ROLES = ["314917626541506570"];
/**
 * 
 * @param {Game} game 
 */
function createEmbed(game) {
    let name = game.name,
        description = game.description,
        host = game.host,
        players = game.players,
        playernumber = game.positions;
    let embed = new discord.RichEmbed();
    let hostData = user.getUserData()[host.id];
    let hostName = hostData.ign + " (@" + getUsername(host) + ") / " + user.getRank(hostData.rank) + " " + hostData.rankNumber;
    embed.setAuthor(hostName, host.user.avatarURL);
    if (game.status == GAME_STATUS_WAITING) {
        embed.setTitle(name + " / Waiting...");
        embed.setColor(0x00FF00); // #00FF00
        description += "\nTo join `%join " + name + "`\nTo quit `%quit`"
    } else if (game.status == GAME_STATUS_STARTED) {
        embed.setTitle(name + " / Started");
        embed.setColor(0x0000FF); // #0000FF
    } else if (game.status == GAME_STATUS_PENDING) {
        embed.setColor(0xFFFF00); // #FFFF00
        embed.setTitle(name + " / Starting in 30 seconds...");
        description += "\nTo Quit `%quit`"
    } else if (game.status == GAME_STATUS_ENDED) {
        embed.setTitle(name + " / Ended");
        description += "\nWon: " + game.won;
        embed.setColor(0xFF0000); // #FF0000
    }
    embed.setDescription(description);
    if (game.status == GAME_STATUS_STARTED || game.status == GAME_STATUS_ENDED) {
        let teamA = "";
        for (let i = 0; i < Math.ceil(playernumber / 2); i++) {
            let player = game.teamA[i];
            let playerData = user.getUserData()[player.id];
            let playerName = playerData.ign;
            teamA += (i + 1) + ". " + playerName + " / " + user.getRank(playerData.rank) + " " + playerData.rankNumber + "\n";
        }
        let teamB = "";
        for (let i = 0; i < Math.ceil(playernumber / 2); i++) {
            let player = game.teamB[i];
            let playerData = user.getUserData()[player.id];
            let playerName = playerData.ign;
            teamB += (i + 1) + ". " + playerName + " / " + user.getRank(playerData.rank) + " " + playerData.rankNumber + "\n";
        }
        embed.addField("Team A", teamA, true);
        embed.addField("Team B", teamB, true);
    } else {
        for (let i = 0; i < playernumber; i++) {
            let player = players[i];
            if (player) {
                let playerData = user.getUserData()[player.id];
                let playerName = playerData.ign + " (@" + getUsername(player) + ")";
                embed.addField((i + 1) + ". " + playerName, user.getRank(playerData.rank) + " " + playerData.rankNumber, true);
            } else {
                embed.addField((i + 1) + ". waiting...", "waiting...", true);
            }
        }
    }
    embed.setThumbnail("https://i.pinimg.com/736x/2d/cc/36/2dcc363a73f27511e51969ac8cc15b92--league-of-legends-logo-logo-google.jpg");
    return embed;
}
/**
 * 
 * @param {GuildMember[]} players 
 */
function matchMaking(players) {
    players.sort((a, b) => {
        let userA = user.getUserData(a);
        let userB = user.getUserData(b);
        let userAscore = userA.rank * 10 + (5 - userA.rankNumber);
        let userBscore = userB.rank * 10 + (5 - userB.rankNumber);
        return userAscore - userBscore;
    });
    /**
     * @type {GuildMember[][]} 
     */
    let teams = [];
    teams[0] = [];
    teams[1] = [];
    for (let i = 0; i < players.length / 2; i++) {
        let first = i;
        let last = (players.length - 1) - i;
        if (i % 2 == 0) {
            teams[0].push(players[first], players[last]);
        } else {
            teams[1].push(players[first], players[last]);
        }
    }
    return teams;
}
/**
 * 
 * @param {Message} msg 
 */
function host(msg) {
    if (!user.getUserData(msg.author)) {
        msg.channel.send(new discord.RichEmbed().setDescription("You must set up a profile before joining a game! Use the `%ign` command to setup a profile").setColor(EMBED_NEUTRAL))
        return;
    }
    let host = msg.guild.members.find("id", msg.author.id);
    let description = "";
    let tokens = msg.content.split(" ");
    if (tokens.length < 3) {
        // If there's not enough arguments then send a usage message and exit
        msg.channel.send(new discord.RichEmbed().setDescription("Usage `%host <name> <positions>`").setColor(EMBED_NEUTRAL))
        return;
    }
    let name = tokens[1];
    let positions = parseInt(tokens[2]);
    games[name] = {
        name: name,
        description: description,
        host: host,
        players: [],
        positions: positions,
        status: GAME_STATUS_WAITING
    };
    msg.channel.send(createEmbed(games[name]))
        .then((msg) => {
            games[name].originalMsg = msg;
        });
}
/**
 * 
 * @param {Message} msg 
 */
function autoJoin(msg) {
    if (!user.getUserData()[msg.author.id]) {
        // If we can't find their profile, tell them and then exit
        msg.channel.send(new discord.RichEmbed().setDescription("You must set up a profile before joining a game! Use the `%ign` command to setup a profile").setColor(EMBED_NEUTRAL))
        return;
    }
    let player = msg.guild.members.find("id", msg.author.id);
    let pdata = user.getUserData(player);
    let pscore = pdata.rank * 15 - pdata.rankNumber;
    /**
     * @type {Game}
     */
    let game = null;
    // for right now we use the naive, avg based approach. will work ok for now
    let avg = 1000000000;
    for (let key in games) {
        if (!games.hasOwnProperty(key)) continue;
        let g = games[key];
        if (g.status == GAME_STATUS_STARTED || g.status == GAME_STATUS_PENDING) continue;
        let score = 0;
        for (let player in g.players) {
            let pl = user.getUserData(g.players[player]);
            score += pl.rank * 10 + (5 - pl.rankNumber);
        }
        score /= g.positions;
        let dist = Math.abs(avg - pscore);
        if (dist < avg) {
            avg = dist;
            game = g;
        }
    }
    if (game == null) {
        msg.channel.send(new discord.RichEmbed().setDescription("I can't see any active games").setColor(EMBED_NEUTRAL))
    } else {
        doJoin(game, msg);
        msg.channel.send(new discord.RichEmbed().setDescription("Joined " + game.name).setColor(EMBED_NEUTRAL))
    }
    game.originalMsg.edit(createEmbed(game));
}
/**
 * 
 * @param {Message} msg 
 */
function join(msg) {
    if (!user.getUserData()[msg.author.id]) {
        msg.channel.send(new discord.RichEmbed().setDescription("You must set up a profile before joining a game! Use the `%ign` command to setup a profile").setColor(EMBED_NEUTRAL))
        return;
    }
    let tokens = msg.content.split(" ");
    if (tokens.length < 2) {
        msg.channel.send(new discord.RichEmbed().setTitle("Usage").setDescription("```%join <name>```").setColor(EMBED_NEUTRAL))
        return;
    }
    name = tokens[1];
    let player = msg.guild.members.find("id", msg.author.id);
    let game = games[name];
    if (!game) {
        msg.channel.send(new discord.RichEmbed().setDescription("I can't find that game.").setColor(EMBED_NEUTRAL))
        return;
    }
    for (let key in games) {
        let g = games[key];
        if (g.players.includes(player)) {
            msg.channel.send(new discord.RichEmbed().setDescription("You're already in `" + g.name + "`").setColor(EMBED_NEUTRAL))
            return;
        }
    }
    if (game.status != GAME_STATUS_WAITING) {
        msg.channel.send(new discord.RichEmbed().setDescription("That game has already started").setColor(EMBED_NEUTRAL))
        return;
    }
    doJoin(game, msg);
    msg.channel.send(new discord.RichEmbed().setDescription("Joined " + game.name).setColor(EMBED_NEUTRAL))
    game.originalMsg.edit(createEmbed(game));
}
/**
 * 
 * @param {Game} game
 * @param {Message} msg 
 */
function doJoin(game, msg) {
    let player = msg.guild.members.find("id", msg.author.id);
    game.players.push(player);
    if (game.positions == game.players.length) {
        game.status = GAME_STATUS_PENDING;
        let notify = "Game starting in 30 seconds...";
        for (let i = 0; i < game.positions; i++) {
            notify += " <@" + game.players[i].id + ">";
        }
        msg.channel.send(notify)
            .then((amsg) => {
                game.notify = amsg;
            });
        game.timeout = setTimeout(() => {
            game.status = GAME_STATUS_STARTED;
            let notify = "Game has started!";
            for (let i = 0; i < game.positions; i++) {
                notify += " <@" + game.players[i].id + ">";
            }
            game.notify.channel.send(notify);
            let teams = matchMaking(game.players);
            game.teamA = teams[0];
            game.teamB = teams[1];
            game.originalMsg.edit(createEmbed(game));
        }, 10000);
    }
}
/**
 * 
 * @param {Message} msg 
 */
function quit(msg) {
    let player = msg.guild.members.find("id", msg.author.id);
    let game;
    for (let key in games) {
        let g = games[key];
        if (g.players.includes(player)) {
            game = g;
            break;
        }
    }
    if (!game) {
        msg.channel.send(new discord.RichEmbed().setDescription("You're not in a game").setColor(EMBED_NEUTRAL))
        return;
    }
    if (game.status == GAME_STATUS_STARTED) {
        msg.channel.send(new discord.RichEmbed().setTitle("Could not leave!").setDescription("The game has already started.").setColor(EMBED_NEUTRAL))
        return;
    } else if (game.status == GAME_STATUS_PENDING) {
        clearTimeout(game.timeout);
        game.status = GAME_STATUS_WAITING;
    }
    game.players = game.players.filter(item => item !== player);
    game.originalMsg.edit(createEmbed(game));
}
/**
 * 
 * @param {Message} msg 
 */
function cancel(msg) {
    let tokens = msg.content.split(" ");
    if (tokens.length < 2) {
        msg.channel.send(new discord.RichEmbed().setTitle("Usage").setDescription("```%cancel <name>```").setColor(EMBED_NEUTRAL))
        return;
    }
    name = tokens[1];
    if (!games[name]) {
        msg.channel.send(new discord.RichEmbed().setDescription("I can't find the game `" + name + "`").setColor(EMBED_NEUTRAL))
        return;
    }
    games[name].originalMsg.delete();
    delete games[name];
    msg.channel.send(new discord.RichEmbed().setDescription("Cancelled :thumbsup:").setColor(EMBED_NEUTRAL))
}
/**
 * 
 * @param {Message} msg 
 */
function end(msg) {
    let tokens = msg.content.split(" ");
    if (tokens.length < 3 || (tokens[2] != "A" && tokens[2] != "B")) {
        msg.channel.send(new discord.RichEmbed().setTitle("Usage").setDescription("```%end <name> <winner: A / B>```").setColor(EMBED_NEUTRAL))
        return;
    }
    name = tokens[1];
    let game = games[name];
    game.status = GAME_STATUS_ENDED;
    game.won = "Team " + tokens[2];
    game.originalMsg.edit(createEmbed(game));
    delete games[name];
}
/**
 * 
 * @param {Message} msg 
 */
function list(msg) {
    for (let key in games) {
        let game = games[key];
        game.originalMsg.channel.send(createEmbed(game))
            .then((amsg) => {
                game.originalMsg.delete();
                game.originalMsg = amsg;
            });
    }
}
module.exports = {
    load: function() {
        commands.reg("%join", join, false, "Join a game");
        commands.reg("%j", join, false, "Join a game");
        commands.reg("%autojoin", autoJoin, false, "Auto Join a game");
        commands.reg("%aj", autoJoin, false, "Auto Join a game");
        commands.reg("%quit", quit, false, "Quit a pending game");
        commands.reg("%q", quit, false, "Quit a pending game");
        commands.reg("%host", host, EVENT_ORGANIZER_ROLES, "Host a game");
        commands.reg("%list", list, EVENT_ORGANIZER_ROLES, "List all games");
        commands.reg("%cancel", cancel, EVENT_ORGANIZER_ROLES, "Cancel a game");
        commands.reg("%end", end, EVENT_ORGANIZER_ROLES, "End a game");
    }
}