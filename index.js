const dotenv = require("dotenv");
dotenv.config();

require("./cronJob");

console.log("Microservice running with cron job.");
