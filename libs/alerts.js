var database = require("./database");
var utils = require("./utils");
var { loadCron } = require("../libs/cronjobs");

var { con2 } = database.getMySQLConnections();

async function upsertRecurrentAlert(dt, days, task_id, text, user_id) {
  var t = dt.split(" ")[1];
  var cron_string = utils.toCron(days, t);

  var sql1 = "SELECT * FROM alerts WHERE task_id = ? AND user_id = ?";
  var [result] = await con2.query(sql1, [task_id, user_id]);
  if (result.length < 1) {
    var sql2 = "INSERT INTO alerts (task_id, cron_string, text, user_id) VALUES (?, ?, ?, ?)";
    await con2.query(sql2, [task_id, cron_string, text, user_id]);
  } else {
    var sql2 = "UPDATE alerts SET cron_string = ?, text = ? WHERE task_id = ? AND user_id = ?";
    await con2.query(sql2, [cron_string, text, task_id, user_id]);
  }
  loadCron();
}

async function insertRecurrentAlert(dt, days, task_id, text, user_id) {
  var t = dt.split(" ")[1];
  var cron_string = utils.toCron(days, t);

  var sql = "INSERT INTO alerts (task_id, cron_string, text, user_id) VALUES (?, ?, ?, ?)";
  await con2.query(sql, [task_id, cron_string, text, user_id]);
  loadCron();
}

async function deleteRecurrentAlert(task_id, user_id) {
  var sql = "DELETE FROM alerts WHERE task_id = ? AND user_id = ?";
  await con2.query(sql, [task_id, user_id]);
  loadCron();
}

async function listAlerts(user_id) {
  var sql = "SELECT * FROM alerts WHERE user_id = ?";
  var [rows, fields] = await con2.query(sql, [user_id]);
  return rows;
}

module.exports = {
  upsertRecurrentAlert,
  insertRecurrentAlert,
  deleteRecurrentAlert,
  listAlerts,
  default: {
    upsertRecurrentAlert,
    insertRecurrentAlert,
    deleteRecurrentAlert,
    listAlerts
  },
};
