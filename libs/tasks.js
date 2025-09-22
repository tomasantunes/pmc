var database = require('./database');

var { con, con2 } = database.getMySQLConnections();

async function getTaskList() {
  var sql = "SELECT description FROM tasks WHERE is_done = 0";

  const [rows, fields] = await con2.execute(sql);
  var arr = rows.map(a => a.description);
  return arr;
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

async function checkIfTaskIsToday(task) {
  var today = new Date();
  var dd = today.getDate();
  var wd = today.getDay() - 1;
  var mm = today.getMonth() + 1;

  var is_cancelled = await checkIfTaskIsCancelled(task.id, today.toISOString().slice(0, 10));

  var days = task.days.split(",");
  days = days.map(Number);
  if (days.includes(wd) && !is_cancelled) {
    return true;
  }
  return false;
}

async function getTodayTasks(tasks, cb) {
  var today_tasks = [];
  for (var i in tasks) {
    if (await checkIfTaskIsToday(tasks[i])) {
      today_tasks.push(tasks[i].id);
    }
  }
  cb(today_tasks);
}

async function getTaskChecks(task_id, dti, dtf) {
  var sql = "SELECT * FROM recurrent_checks WHERE task_id = ? AND date BETWEEN ? AND ?";
  const [rows, fields] = await con2.execute(sql, [task_id, dti, dtf]);
  return rows;
}

module.exports = {
    getTaskList,
    checkIfTaskIsCancelled,
    getTodayTasks,
    checkIfTaskIsToday,
    getTaskChecks,
    default: {
        getTaskList,
        checkIfTaskIsCancelled,
        getTodayTasks,
        checkIfTaskIsToday,
        getTaskChecks
    }
};