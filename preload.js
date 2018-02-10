const fs = require("fs");

fs.writeFileSync("./config/config.json", process.env.CONFIG_CONTENT)

var spawn = require('child_process').spawn;
var prc = spawn('node', ['main.js']);
prc.stdout.setEncoding('utf8');
prc.stdout.on('data', function(data) {
    var str = data.toString()
    console.log(str.substring(0, str.length - 1));
});

prc.on('close', function(code) {
    console.log('process exit code ' + code);
});