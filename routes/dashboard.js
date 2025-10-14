var express = require('express');
var database = require('../libs/database');
var tasks = require('../libs/tasks');
var router = express.Router();
var {fillMissingDays} = require('../libs/stats');

var {con, con2 } = database.getMySQLConnections();

router.get("/api/get-stats", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

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
      var sql3 = "SELECT * FROM tasks WHERE type = 'recurrent'";
      con.query(sql3, function (err3, result3) {
        if (err) {
          console.log(err);
          res.json({status: "NOK", error: err.message});
        }
        tasks.getTasksOnThisWeekDay(result3, function(tasks_on_this_week_day) {
          if (tasks_on_this_week_day.length > 0) {
            var sql4 = "SELECT * FROM recurrent_checks WHERE task_id IN (?) AND date = DATE(NOW())";
            con.query(sql4, [tasks_on_this_week_day], function (err4, result4) {
              if (err4) {
                console.log(err4);
                res.json({status: "NOK", error: err4.message});
              }
              var today_tasks = result4.length;
              var today_tasks_done = 0;
              for (var i = 0; i < result4.length; i++) {
                if (result4[i].is_done == 1) {
                  today_tasks_done++;
                }
              }
              res.json({status: "OK", data: {total_tasks: total_tasks, total_tasks_done: total_tasks_done, recurrent_tasks: today_tasks, recurrent_tasks_done: today_tasks_done}});
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

router.get("/api/get-count-tasks-last-15-days", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const [rows] = await con2.execute(`
    SELECT 
        done_date AS date,
        COUNT(*) AS done_count
    FROM (
        SELECT 
            DATE(t.date_done) AS done_date
        FROM tasks t
        WHERE 
            t.type = 'single'
            AND t.is_done = 1
            AND t.date_done >= CURDATE() - INTERVAL 15 DAY

        UNION ALL

        SELECT 
            rc.date AS done_date
        FROM recurrent_checks rc
        INNER JOIN tasks t ON rc.task_id = t.id
        WHERE 
            t.type = 'recurrent'
            AND rc.is_done = 1
            AND rc.date >= CURDATE() - INTERVAL 15 DAY
    ) AS all_done
    GROUP BY done_date
    ORDER BY done_date;
  `);

  const filledData = fillMissingDays(rows);

  res.json({status: "OK", data: filledData});
});

module.exports = router;