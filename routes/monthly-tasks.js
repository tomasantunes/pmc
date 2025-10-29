var express = require('express');
var database = require('../libs/database');
var utils = require('../libs/utils');
var tasks = require('../libs/tasks');
var recurrentTasks = require('../libs/recurrent-tasks');
var router = express.Router();

var {con, con2 } = database.getMySQLConnections();

router.get("/api/get-monthly-tasks", async (req, res) => {
  try {
    if (!req.session.isLoggedIn) {
      return res.json({ status: "NOK", error: "Invalid Authorization." });
    }

    const { folder_id, dti, dtf } = req.query;

    if (!folder_id || !dti || !dtf) {
      return res.json({ status: "NOK", error: "Missing parameters." });
    }

    // Get all monthly tasks for this folder
    const sql = `
      SELECT *,
             CONCAT(DATE_FORMAT(start_time, '%H:%i'), ' - ', DATE_FORMAT(end_time, '%H:%i')) AS time
      FROM tasks
      WHERE folder_id = ?
      ORDER BY sort_index ASC
    `;

    const [tasks] = await con.promise().query(sql, [folder_id]);

    for (const task of tasks) {
      const task_id = task.id;

      // Get recurrent checks for this task within the given range
      const checks = await recurrentTasks.getTaskChecks(task_id, dti, dtf);
      task.checks = checks;

      // --- Build the list of months between dti and dtf (inclusive)
      const monthRange = utils.getRangeOfMonths(new Date(dti), new Date(dtf)); 
      // This should return e.g. [new Date('2025-01-01'), new Date('2025-02-01'), ...]

      const monthsArray = task.months ? task.months.split(",") : [];

      for (const m of monthRange) {
        const monthIndex = m.getMonth(); // 0-11
        const isoMonth = utils.toLocaleISOString(m).slice(0, 7); // YYYY-MM

        // Check if this month is cancelled
        const isCancelled = await recurrentTasks.checkIfTaskIsCancelled(task_id, isoMonth);

        if (isCancelled) {
          const idx = monthsArray.indexOf(monthIndex.toString());
          if (idx !== -1) monthsArray.splice(idx, 1);
        }
      }

      task.months = monthsArray.join(",");

      // Hide time if it’s the fake 1970 one
      if (
        task.start_time === "1970-01-01 00:00:00" &&
        task.end_time === "1970-01-01 00:00:00"
      ) {
        task.time = "";
      }
    }

    console.log("Monthly Tasks:");
    console.log(tasks);

    return res.json({ status: "OK", data: tasks });

  } catch (err) {
    console.error("Error in /api/get-monthly-tasks:", err);
    return res.json({ status: "NOK", error: err.message });
  }
});

router.post("/api/add-monthly-task", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({ status: "NOK", error: "Invalid Authorization." });
    return;
  }

  const folder_id = req.body.folder_id;
  const description = req.body.description;
  const months = req.body.months; // comma-separated list of month indexes (0–11)
  const sort_index = req.body.sort_index;

  let start_time2 = "1970-01-01 00:00";
  let end_time2 = "1970-01-01 00:00";

  const sql =
    "INSERT INTO tasks (folder_id, description, start_time, end_time, type, months, sort_index, is_done) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

  con.query(
    sql,
    [folder_id, description, start_time2, end_time2, "monthly", months, sort_index, 0],
    async function (err, result) {
      if (err) {
        console.log(err);
        res.json({ status: "NOK", error: err.message });
        return;
      }

      try {
        // Generate one date for each selected month
        const dates = utils.getMonthlyDates(months);

        for (let date of dates) {
          const sql2 = "INSERT INTO recurrent_checks (task_id, date, is_done) VALUES (?, ?, 0)";
          await con2.query(sql2, [result.insertId, date.toISOString().slice(0, 10)]);
        }

        res.json({ status: "OK", data: "Monthly task has been added successfully." });
      } catch (err2) {
        console.log(err2);
        res.json({ status: "NOK", error: err2.message });
      }
    }
  );
});

router.post("/api/update-monthly-task-done", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var task_id = req.body.task_id;
  var is_done = req.body.is_done;
  var date = req.body.date;
  var sql = "SELECT * FROM recurrent_checks WHERE task_id = ? AND date = ?";
  con.query(sql, [task_id, date], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
      return;
    }
    if (result.length > 0) {
      var sql2 = "UPDATE recurrent_checks SET is_done = ? WHERE task_id = ? AND date = ?";
      con.query(sql2, [is_done, task_id, date], function (err, result) {
        if (err) {
          console.log(err);
          res.json({status: "NOK", error: err.message});
        }
        res.json({status: "OK", data: "Task has been updated successfully."});
      });
    }
    else {
      var sql2 = "INSERT INTO recurrent_checks (task_id, date, is_done) VALUES (?, ?, ?)";
      con.query(sql2, [task_id, date, is_done], function (err, result) {
        if (err) {
          console.log(err);
          res.json({status: "NOK", error: err.message});
        }
        res.json({status: "OK", data: "Task has been updated successfully."});
      });
    }
  });
});

router.post("/api/edit-monthly-task", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({ status: "NOK", error: "Invalid Authorization." });
    return;
  }

  const task_id = req.body.task_id;
  const description = req.body.description;
  const start_time = req.body.start_time;
  const end_time = req.body.end_time;
  const months = req.body.months;

  let start_time2, end_time2, has_time = false;

  if (
    typeof start_time === "undefined" ||
    start_time === "" ||
    typeof end_time === "undefined" ||
    end_time === ""
  ) {
    start_time2 = utils
      .toLocaleISOString(new Date("1970-01-01Z00:00:00:000"))
      .slice(0, 19)
      .replace("T", " ");
    end_time2 = utils
      .toLocaleISOString(new Date("1970-01-01Z00:00:00:000"))
      .slice(0, 19)
      .replace("T", " ");
  } else {
    start_time2 = start_time;
    end_time2 = end_time;
    has_time = true;
  }

  const sql =
    "UPDATE tasks SET description = ?, start_time = ?, end_time = ?, months = ? WHERE id = ?";

  con.query(sql, [description, start_time2, end_time2, months, task_id], async function (err, result) {
    if (err) {
      console.log(err);
      res.json({ status: "NOK", error: err.message });
      return;
    }

    try {
      // Remove all future checks and events
      const sql2 = "DELETE FROM recurrent_checks WHERE task_id = ? AND date > DATE(NOW())";
      await con2.query(sql2, [task_id]);

      const sql3 = "DELETE FROM events WHERE task_id = ? AND start_date > DATE(NOW())";
      await con2.query(sql3, [task_id]);

      // Generate future monthly dates
      const dates = utils.getMonthlyDates(months);

      for (let date of dates) {
        const sql4 = "INSERT INTO recurrent_checks (task_id, date, is_done) VALUES (?, ?, 0)";
        await con2.query(sql4, [task_id, date.toISOString().slice(0, 10)]);

        if (has_time) {
          const start_date = new Date(date);
          const [stHour, stMin] = start_time.split(" ")[1].split(":");
          start_date.setHours(stHour, stMin, 0);

          const end_date = new Date(date);
          const [etHour, etMin] = end_time.split(" ")[1].split(":");
          end_date.setHours(etHour, etMin, 0);

          const sql5 =
            "INSERT INTO events (task_id, start_date, end_date, description) VALUES (?, ?, ?, ?)";
          await con2.query(sql5, [
            task_id,
            start_date.toISOString().slice(0, 19).replace("T", " "),
            end_date.toISOString().slice(0, 19).replace("T", " "),
            description,
          ]);
        }
      }

      res.json({ status: "OK", data: "Monthly task has been updated successfully." });
    } catch (err2) {
      console.log(err2);
      res.json({ status: "NOK", error: err2.message });
    }
  });
});


router.post("/api/restart-monthly-task", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var task_id = req.body.task_id;
  var now = new Date();
  var now_date = utils.toLocaleISOString(now).slice(0, 10);
  var now_datetime = utils.toLocaleISOString(now);

  var sql = "DELETE FROM recurrent_checks WHERE task_id = ? AND date < ?";
  await con2.query(sql, [task_id, now_date]);

  var sql2 = "DELETE FROM events WHERE task_id = ? AND start_date < DATE(NOW())";
  await con2.query(sql2, [task_id]);

  var sql3 = "UPDATE tasks SET created_at = ? WHERE id = ?";
  await con2.query(sql3, [now_datetime, task_id]);

  res.json({status: "OK", data: "Recurrent task has been restarted."})
});

router.post("/api/cancel-monthly-task", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var task_id = req.body.task_id;
  var dt = req.body.date;

  var sql = "SELECT * FROM recurrent_checks WHERE task_id = ? AND date = ?";
  con.query(sql, [task_id, dt], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
      return;
    }
    if (result.length > 0) {
      if (result[0].is_done == 1) {
        res.json({status: "NOK", error: "Task has already been done."});
        return;
      }
      else {
        var sql2 = "UPDATE recurrent_checks SET is_cancelled = 1 WHERE task_id = ? AND date = ?";
        con.query(sql2, [task_id, dt], function (err2, result2) {
          if (err2) {
            console.log(err2);
            res.json({status: "NOK", error: err2.message});
          }
          res.json({status: "OK", data: "Task has been cancelled successfully."});
          return;
        });
      }
    }
    else {
      var sql2 = "INSERT INTO recurrent_checks (task_id, date, is_cancelled, is_done) VALUES (?, ?, 1, 0)";
      con.query(sql2, [task_id, dt], function (err2, result2) {
        if (err2) {
          console.log(err2);
          res.json({status: "NOK", error: err2.message});
        }
        res.json({status: "OK", data: "Task has been cancelled successfully."});
        return;
      });
    }
  });
});

router.post("/api/uncancel-monthly-task", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var task_id = req.body.task_id;
  var dt = req.body.date;

  var sql = "SELECT * FROM recurrent_checks WHERE task_id = ? AND date = ?";
  con.query(sql, [task_id, dt], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
      return;
    }
    if (result.length > 0) {
      if (result[0].is_done == 1) {
        res.json({status: "NOK", error: "Task has already been done."});
        return;
      }
      else {
        var sql2 = "UPDATE recurrent_checks SET is_cancelled = 0 WHERE task_id = ? AND date = ?";
        con.query(sql2, [task_id, dt], function (err2, result2) {
          if (err2) {
            console.log(err2);
            res.json({status: "NOK", error: err2.message});
          }
          res.json({status: "OK", data: "Task has been uncancelled successfully."});
          return;
        });
      }
    }
    else {
      var sql2 = "INSERT INTO recurrent_checks (task_id, date, is_cancelled, is_done) VALUES (?, ?, 0, 0)";
      con.query(sql2, [task_id, dt], function (err2, result2) {
        if (err2) {
          console.log(err2);
          res.json({status: "NOK", error: err2.message});
        }
        res.json({status: "OK", data: "Task has been uncancelled successfully."});
        return;
      });
    }
  });
});

module.exports = router;