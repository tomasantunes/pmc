var database = require('./database');
var {checkIfTaskIsOnThisWeekDay} = require('./recurrent-tasks');

var { con, con2 } = database.getMySQLConnections();

async function getTaskList(user_id) {
  var sql = "SELECT description FROM tasks WHERE is_done = 0 AND user_id = ?";

  const [rows, fields] = await con2.execute(sql, [user_id]);
  var arr = rows.map(a => a.description);
  return arr;
}

async function getTasksOnThisWeekDay(tasks, user_id, cb) {
  var today_tasks = [];
  for (var i in tasks) {
    if (await checkIfTaskIsOnThisWeekDay(tasks[i], user_id)) {
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