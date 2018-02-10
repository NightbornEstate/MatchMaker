const fs = require("fs");

fs.writeFileSync("./config/config.json", process.env.CONFIG_CONTENT)