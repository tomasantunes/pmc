var database = require('./database');
var {checkIfTaskIsOnThisWeekDay} = require('./recurrent-tasks');

var { con, con2 } = database.getMySQLConnections();

async function getTaskList() {
  var sql = "SELECT description FROM tasks WHERE is_done = 0";

  const [rows, fields] = await con2.execute(sql);
  var arr = rows.map(a => a.description);
  return arr;
}

async function getTasksOnThisWeekDay(tasks, cb) {
  var today_tasks = [];
  for (var i in tasks) {
    if (await checkIfTaskIsOnThisWeekDay(tasks[i])) {
      today_tasks.push(tasks[i].id);
    }
  }
  cb(today_tasks);
}

module.exports = {
    getTaskList,
    getTasksOnThisWeekDay,
    default: {
        getTaskList,
        getTasksOnThisWeekDay
    }
};