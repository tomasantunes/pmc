var express = require('express');
var database = require('../libs/database');
var tasks = require('../libs/tasks');
var router = express.Router();

var {con, con2 } = database.getMySQLConnections();

router.get("/api/get-stats", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var recurrent_types = ["daily", "weekly", "monthly", "yearly", "week_day", "month_day", "year_day"];

  var sql = "SELECT COUNT(*) FROM tasks WHERE type='single'";
  con.query(sql, function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
    }
    var total_tasks = result[0]["COUNT(*)"];
    var sql2 = "SELECT COUNT(*) FROM tasks WHERE type='single' AND is_done = 1";
    con.query(sql2, function (err2, result2) {
      if (err) {
        console.log(err);
        res.json({status: "NOK", error: err.message});
      }
      var total_tasks_done = result2[0]["COUNT(*)"];
      var sql3 = "SELECT * FROM tasks WHERE type IN (?)";
      con.query(sql3, [recurrent_types], function (err3, result3) {
        if (err) {
          console.log(err);
          res.json({status: "NOK", error: err.message});
        }
        tasks.getTodayTasks(result3, function(today_tasks) {
          if (today_tasks.length > 0) {
            var sql4 = "SELECT * FROM recurrent_checks WHERE task_id IN (?) AND is_done = 1 AND date = DATE(NOW())";
            con.query(sql4, [today_tasks], function (err4, result4) {
              if (err4) {
                console.log(err4);
                res.json({status: "NOK", error: err4.message});
              }
              var today_tasks_done = result4.length;
              res.json({status: "OK", data: {total_tasks: total_tasks, total_tasks_done: total_tasks_done, recurrent_tasks: today_tasks.length, recurrent_tasks_done: today_tasks_done}});
            });
          }
          else {
            res.json({status: "OK", data: {total_tasks: total_tasks, total_tasks_done: total_tasks_done, recurrent_tasks: 0, recurrent_tasks_done: 0}});
          }
        });
      });
    });
  });
});

module.exports = router;