var database = require("./database");
var utils = require("./utils");
var { loadCron } = require("../libs/cronjobs");

var { con, con2 } = database.getMySQLConnections();

function upsertRecurrentAlert(dt, days, task_id, text) {
  var t = dt.split(" ")[1];
  var cron_string = utils.toCron(days, t);

  var sql1 = "SELECT * FROM alerts WHERE task_id = ?";
  con.query(sql1, [task_id], function (err, result) {
    if (err) {
      console.log(err);
      return false;
    }
    if (result.length < 1) {
      var sql2 =
        "INSERT INTO alerts (task_id, cron_string, text) VALUES (?, ?, ?)";
      con.query(sql2, [task_id, cron_string, text], function (err2, result2) {
        if (err2) {
          console.log(err2);
          return false;
        }
        loadCron();
      });
    } else {
      var sql2 =
        "UPDATE alerts SET cron_string = ?, text = ? WHERE task_id = ?";
      con.query(
        sql2,
        [cron_string, alert_text, task_id],
        function (err2, result2) {
          if (err2) {
            console.log(err2);
            return false;
          }
          loadCron();
        },
      );
    }
  });
}

function insertRecurrentAlert(dt, days, task_id, text) {
  var t = dt.split(" ")[1];
  var cron_string = utils.toCron(days, t);

  var sql = "INSERT INTO alerts (task_id, cron_string, text) VALUES (?, ?, ?)";
  con.query(sql, [cron_string, text, task_id], function (err, result) {
    if (err) {
      console.log(err);
      return false;
    }
    loadCron();
  });
}

function deleteRecurrentAlert(task_id) {
  var sql = "DELETE FROM alerts WHERE task_id = ?";
  con.query(sql, [task_id]);
}

module.exports = {
  upsertRecurrentAlert,
  insertRecurrentAlert,
  default: {
    upsertRecurrentAlert,
    insertRecurrentAlert,
  },
};
