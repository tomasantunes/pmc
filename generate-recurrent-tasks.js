var database = require('./libs/database');
var utils = require('./libs/utils');

var {con, con2 } = database.getMySQLConnections();

async function generateRecurrentTasks() {
    var sql = "SELECT * FROM tasks WHERE type = 'recurrent'";

    con.query(sql, async function (err, result) {
        if (err) throw err;

        for (var i in result) {
            var task = result[i];
            var dates = utils.getDatesUntilNextYear(task.days);
            for (var i in dates) {
                var sql2 = "INSERT INTO recurrent_checks (task_id, date, is_done) VALUES (?, ?, ?)";
                await con2.query(sql2, [task.id, dates[i].toISOString().slice(0, 10), 0]);
            }
        }
        console.log("Recurrent tasks generated.");
    });
}

console.log("Starting...");
generateRecurrentTasks();