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

            if (task.start_time != "1970-01-01 00:00:00" && task.end_time != "1970-01-01 00:00:00") {
                for (var i in dates) {
                    var start_date = dates[i];
                    var st = task.start_time.split(" ")[1].split(":");
                    start_date.setHours(st[0], st[1], 0);
                    start_date = start_date.toISOString().slice(0, 19).replace('T', ' ');
                    var end_date = dates[i];
                    var et = task.end_time.split(" ")[1].split(":");
                    end_date.setHours(et[0], et[1], 0);
                    end_date = end_date.toISOString().slice(0, 19).replace('T', ' ');
                    var sql3 = "INSERT INTO events (task_id, start_date, end_date, description) VALUES (?, ?, ?, ?)";
                    await con2.query(sql3, [task.id, start_date, end_date, task.description]);
                }
            }
        }
        console.log("Recurrent tasks generated.");
    });
}

console.log("Starting...");
generateRecurrentTasks();