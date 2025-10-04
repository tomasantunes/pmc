var database = require('./database');

var { con, con2 } = database.getMySQLConnections();

async function getTaskList() {
  var sql = "SELECT description FROM tasks WHERE is_done = 0";

  const [rows, fields] = await con2.execute(sql);
  var arr = rows.map(a => a.description);
  return arr;
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

module.exports = {
    getTaskList,
    getTodayTasks,
    default: {
        getTaskList,
        getTodayTasks
    }
};