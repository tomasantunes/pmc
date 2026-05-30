var express = require("express");
var database = require("../libs/database");
var utils = require("../libs/utils");
var tasks = require("../libs/tasks");
var router = express.Router();

var { con, con2 } = database.getMySQLConnections();

var {getOpenAIInstance, tts} = require('./openai');

async function getCurrentImportantTasks(user_id, folder_id) {
  var sql = "SELECT * FROM tasks WHERE user_id = ? AND is_important = 1 AND is_completed = 0 AND folder_id = ?";
  const [rows, fields] = await con2.execute(sql, [user_id, folder_id]);
  return rows;
}

async function readTasks(user_id, tasks) {
  var important_tasks = await getCurrentImportantTasks(user_id);
  var important_tasks_ids = important_tasks.map(task => task.id);

  // concatenate all the descriptions of the tasks into one string
  var tasksDescriptions = tasks.map(task => task.description).join(" ");

  var ret = await tts(openai, taskDescriptions);
  return ret;
}

router.get("/get-folder-tts", async function(req, res) {
  var user_id = req.query.user_id;
  var folder_id = req.query.folder_id;
  var tasks = await getCurrentImportantTasks(user_id, folder_id);
  var ttsFile = await readTasks(user_id, tasks);
  res.json({ttsFile});
});

module.exports = router;

