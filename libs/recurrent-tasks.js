var database = require('./database');
var utils = require('./utils');

var { con, con2 } = database.getMySQLConnections();

async function getTaskChecks(task_id, dti, dtf) {
  var sql = "SELECT * FROM recurrent_checks WHERE task_id = ? AND date BETWEEN ? AND ?";
  const [rows, fields] = await con2.execute(sql, [task_id, dti, dtf]);
  return rows;
}

async function checkIfTaskIsCancelled(task_id, dt) {
  var sql = "SELECT * FROM recurrent_checks WHERE task_id = ? AND date = ?";
  var [rows, fields] = await con2.execute(sql, [task_id, dt]);
  if (rows.length > 0) {
    if (rows[0].is_cancelled == 1) {
      return true;
    }
    else {
      return false;
    }
  }
  else {
    return false;
  }
}

async function checkIfTaskIsOnThisWeekDay(task) {
  var today = new Date();
  var wd = today.getDay() - 1;

  var is_cancelled = await checkIfTaskIsCancelled(task.id, utils.toLocaleISOString(today).slice(0, 10));

  var days = task.days.split(",");
  days = days.map(Number);
  if (days.includes(wd) && !is_cancelled) {
    return true;
  }
  return false;
}

module.exports = {
    checkIfTaskIsCancelled,
    checkIfTaskIsOnThisWeekDay,
    getTaskChecks,
    default: {
        checkIfTaskIsCancelled,
        checkIfTaskIsOnThisWeekDay,
        getTaskChecks
    }
};