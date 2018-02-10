const discord = require("discord.js");
const fs = require("fs");
var Message = discord.Message;
var BEHAVIOUR_LOCATION = "config/behaviour.json";
var bOutChannels = [];
module.exports = {
    load: function() {
        var MongoClient = require('mongodb').MongoClient;
        var url = require("../config/config.json").db;
        MongoClient.connect(url, {
                authSource: "admin",
                appname: "matchmaker"
            })
            .then((db) => {
                db.db("matchmaker").collection("stores").findOne({
                    target: "behaviour"
                }).then(res => {
                    bOutChannels = res.data.output_block_channels;
                })
            })
    },
    save: function() {
        let data = {
            "output_block_channels": bOutChannels
        };
        var MongoClient = require('mongodb').MongoClient;
        var url = require("../config/config.json").db;
        MongoClient.connect(url, {
                authSource: "admin",
                appname: "matchmaker"
            })
            .then((db) => {
                db.db("matchmaker").collection("stores").findOneAndReplace({
                    target: "behaviour"
                }, {
                    target: "behaviour",
                    data: data
                })
            })
    },
    /**
     * @param {Message} msg
     */
    unblock_output: function(msg) {
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
    block_output: function(msg) {
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
    is_output_blocked: function(msg) {
        return bOutChannels[msg.channel.id] == true;
    }
}