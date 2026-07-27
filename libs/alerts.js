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
  await loadCron();
}

async function insertRecurrentAlert(dt, days, task_id, text, user_id) {
  var t = dt.split(" ")[1];
  var cron_string = utils.toCron(days, t);

  var sql = "INSERT INTO alerts (task_id, cron_string, text, user_id) VALUES (?, ?, ?, ?)";
  await con2.query(sql, [task_id, cron_string, text, user_id]);
  await loadCron();
}

async function deleteRecurrentAlert(task_id, user_id) {
  var sql = "DELETE FROM alerts WHERE task_id = ? AND user_id = ?";
  await con2.query(sql, [task_id, user_id]);
  await loadCron();
}

function toSimpleTaskCron(dt) {
  var match = String(dt).match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/,
  );
  if (!match) {
    throw new Error("Invalid simple task start time.");
  }

  var month = Number(match[2]);
  var day = Number(match[3]);
  var hour = Number(match[4]);
  var minute = Number(match[5]);
  return `${minute} ${hour} ${day} ${month} *`;
}

async function upsertSimpleAlert(dt, task_id, text, user_id) {
  var cron_string = toSimpleTaskCron(dt);

  // Older databases may not have a unique task/user index, so update first.
  var updateSql =
    "UPDATE alerts SET cron_string = ?, text = ? WHERE task_id = ? AND user_id = ?";
  var [result] = await con2.query(updateSql, [cron_string, text, task_id, user_id]);
  if (result.affectedRows < 1) {
    await con2.query(
      "INSERT INTO alerts (task_id, cron_string, text, user_id) VALUES (?, ?, ?, ?)",
      [task_id, cron_string, text, user_id],
    );
  }
  await loadCron();
}

async function deleteSimpleAlert(task_id, user_id) {
  await deleteRecurrentAlert(task_id, user_id);
}

async function listAlerts(user_id) {
  var sql = "SELECT * FROM alerts WHERE user_id = ?";
  var [rows, fields] = await con2.query(sql, [user_id]);
  return rows;
}

async function insertStandaloneAlert(cron_string, text, user_id) {
  var sql =
    "INSERT INTO alerts (task_id, cron_string, text, user_id) VALUES (NULL, ?, ?, ?)";
  var [result] = await con2.query(sql, [cron_string, text, user_id]);
  await loadCron();
  return result.insertId;
}

async function updateAlert(id, cron_string, text, user_id) {
  var sql =
    "UPDATE alerts SET cron_string = ?, text = ? WHERE id = ? AND user_id = ?";
  var [result] = await con2.query(sql, [cron_string, text, id, user_id]);
  await loadCron();
  return result.affectedRows;
}

async function deleteAlert(id, user_id) {
  var sql = "DELETE FROM alerts WHERE id = ? AND user_id = ?";
  var [result] = await con2.query(sql, [id, user_id]);
  await loadCron();
  return result.affectedRows;
}

module.exports = {
  upsertRecurrentAlert,
  insertRecurrentAlert,
  deleteRecurrentAlert,
  upsertSimpleAlert,
  deleteSimpleAlert,
  listAlerts,
  insertStandaloneAlert,
  updateAlert,
  deleteAlert,
  default: {
    upsertRecurrentAlert,
    insertRecurrentAlert,
    deleteRecurrentAlert,
    upsertSimpleAlert,
    deleteSimpleAlert,
    listAlerts,
    insertStandaloneAlert,
    updateAlert,
    deleteAlert
  },
};
