var express = require("express");
var database = require("../libs/database");
var utils = require("../libs/utils");
var tasks = require("../libs/tasks");
var router = express.Router();
var path = require("path");

var { con, con2 } = database.getMySQLConnections();

var {getOpenAIInstance, tts} = require('../libs/openai');

async function getCurrentImportantTasks(user_id, folder_id) {
  console.log("Generating TTS for user " + user_id + " and folder " + folder_id);
  var sql = "SELECT * FROM tasks WHERE user_id = ? AND starred = 1 AND is_done = 0 AND folder_id = ?";
  const [rows, fields] = await con2.execute(sql, [user_id, folder_id]);
  return rows;
}

async function readTasks(user_id, folder_id) {
  var important_tasks = await getCurrentImportantTasks(user_id, folder_id);

  // concatenate all the descriptions of the tasks into one string
  var tasksDescriptions = important_tasks.map(task => task.description).join(" ");

  var openai = getOpenAIInstance();
  var ret = await tts(openai, tasksDescriptions);
  return ret;
}

router.get("/get-folder-tts", async function(req, res) {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  try {
    var user_id = req.session.userId;
    var folder_id = req.query.folder_id;
    console.log("Generating TTS for user " + user_id + " and folder " + folder_id);
    var ttsFile = await readTasks(user_id, folder_id);
    res.json({status: "OK", ttsFile: ttsFile});
  } catch (error) {
    console.log(error);
    res.json({status: "NOK", error: "An error occurred while generating the TTS."});
  }
});

router.get("/api/get-audio", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var filename = req.query.filename;

  res.sendFile(path.join(__dirname, "/../speech/"+filename));
});

module.exports = router;

