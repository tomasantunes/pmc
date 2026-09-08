var crypto = require("crypto");
var express = require("express");
var database = require("../libs/database");

var router = express.Router();
var { con2 } = database.getMySQLConnections();

var tables = [
  "folders",
  "tasks",
  "recurrent_checks",
  "events",
  "daily_todos_tasks",
  "alerts",
];

function hasValidApiKey(req) {
  var configuredKey = process.env.EXTERNAL_API_KEY;
  var authorization = req.get("authorization") || "";
  var suppliedKey = authorization.replace(/^Bearer\s+/i, "");

  if (!configuredKey || !suppliedKey) return false;

  var configuredKeyBuffer = Buffer.from(configuredKey);
  var suppliedKeyBuffer = Buffer.from(suppliedKey);

  return configuredKeyBuffer.length === suppliedKeyBuffer.length
    && crypto.timingSafeEqual(configuredKeyBuffer, suppliedKeyBuffer);
}

router.get("/external/get-data", async (req, res) => {
  if (!hasValidApiKey(req)) {
    return res.status(401).json({ status: "NOK", error: "Invalid Authorization." });
  }

  try {
    var results = await Promise.all(
      tables.map(async (table) => {
        var [rows] = await con2.query(`SELECT * FROM \`${table}\``);
        return [table, rows];
      }),
    );

    return res.json(Object.fromEntries(results));
  } catch (err) {
    console.error("Unable to retrieve external data:", err);
    return res.status(500).json({ status: "NOK", error: "Unable to retrieve data." });
  }
});

module.exports = router;
