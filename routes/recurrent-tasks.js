var express = require("express");
var database = require("../libs/database");
var utils = require("../libs/utils");
var recurrentTasks = require("../libs/recurrent-tasks");
var {
  upsertRecurrentAlert,
  insertRecurrentAlert,
  deleteRecurrentAlert,
} = require("../libs/alerts");

var router = express.Router();

var { con, con2 } = database.getMySQLConnections();

router.get("/api/get-recurrent-tasks", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({ status: "NOK", error: "Invalid Authorization." });
    return;
  }
  var folder_id = req.query.folder_id;
  var dti = req.query.dti;
  var dtf = req.query.dtf;
  var sql =
    "SELECT *, CONCAT(DATE_FORMAT(start_time, '%H:%i'), ' - ', DATE_FORMAT(end_time, '%H:%i')) AS time FROM tasks WHERE folder_id = ? ORDER BY sort_index ASC";
  con.query(sql, [folder_id], async function (err, result) {
    if (err) {
      console.log(err);
      res.json({ status: "NOK", error: err.message });
      return;
    }

    for (var i in result) {
      var task_id = result[i].id;
      var checks = await recurrentTasks.getTaskChecks(task_id, dti, dtf);
      result[i].checks = checks;

      var dt_range = utils.getRangeOfDates(new Date(dti), new Date(dtf));
      for (var j in dt_range) {
        var dt = dt_range[j];
        var wd = dt.getDay();
        var is_cancelled = await recurrentTasks.checkIfTaskIsCancelled(
          task_id,
          utils.toLocaleISOString(dt).slice(0, 10),
        );
        if (is_cancelled) {
          var days = result[i].days.split(",");
          var idx_to_remove = days.indexOf(wd.toString());
          days.splice(idx_to_remove, 1);
          result[i].days = days.join(",");
        }
      }

      if (
        result[i].start_time == "1970-01-01 00:00:00" &&
        result[i].end_time == "1970-01-01 00:00:00"
      ) {
        result[i].time = "";
        result[i].start_time = "";
        result[i].end_time = "";
      }
    }
    console.log("Result:");
    console.log(result);
    res.json({ status: "OK", data: result });
  });
});

router.get("/api/get-recurrent-task", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({ status: "NOK", error: "Invalid Authorization." });
    return;
  }
  var task_id = req.query.task_id;
  var sql = "SELECT * FROM tasks WHERE id = ? AND type = 'recurrent'";
  con.query(sql, [task_id], function (err, result) {
    if (err) {
      console.log(err);
      res.json({ status: "NOK", error: err.message });
    }

    if (result.length > 0) {
      var sql2 = "SELECT * FROM alerts WHERE task_id = ?";
      con.query(sql2, [task_id], function (err2, result2) {
        if (err2) {
          console.log(err2);
          res.json({ status: "NOK", error: err2.message });
        }

        if (result2.length > 0) {
          result[0].alert_active = true;
          result[0].alert_text = result2[0].text;
        } else {
          result[0].alert_active = false;
          result[0].alert_text = "";
        }
        return res.json({ status: "OK", data: result[0] });
      });
    } else {
      return res.json({ status: "NOK", error: "Task not found." });
    }
  });
});

router.post("/api/add-recurrent-task", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({ status: "NOK", error: "Invalid Authorization." });
    return;
  }
  var folder_id = req.body.folder_id;
  var description = req.body.description;
  var start_time = req.body.start_time;
  var end_time = req.body.end_time;
  var days = req.body.days;
  var sort_index = req.body.sort_index;
  var alert_active = req.body.alert_active;
  var alert_text = req.body.alert_text;

  var start_time2;
  var end_time2;
  var has_time = false;

  if (
    typeof start_time == "undefined" ||
    start_time == "" ||
    typeof end_time == "undefined" ||
    end_time == "" ||
    start_time == "Invalid date" ||
    end_time == "Invalid date"
  ) {
    start_time2 = "1970-01-01 00:00";
    end_time2 = "1970-01-01 00:00";
  } else {
    start_time2 = start_time;
    end_time2 = end_time;
    has_time = true;
  }

  var sql =
    "INSERT INTO tasks (folder_id, description, start_time, end_time, type, days, sort_index, is_done) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
  con.query(
    sql,
    [
      folder_id,
      description,
      start_time2,
      end_time2,
      "recurrent",
      days,
      sort_index,
      0,
    ],
    async function (err, result) {
      if (err) {
        console.log(err);
        res.json({ status: "NOK", error: err.message });
        return;
      }

      var dates = utils.getDatesUntilNextYear(days);

      for (var i in dates) {
        var sql2 =
          "INSERT INTO recurrent_checks (task_id, date, is_done) VALUES (?, ?, ?)";
        await con2.query(sql2, [
          result.insertId,
          dates[i].toISOString().slice(0, 10),
          0,
        ]);

        if (has_time) {
          var start_date = dates[i];
          var st = start_time.split(" ")[1].split(":");
          start_date.setHours(st[0], st[1], 0);
          start_date = start_date.toISOString().slice(0, 19).replace("T", " ");
          var end_date = dates[i];
          var et = end_time.split(" ")[1].split(":");
          end_date.setHours(et[0], et[1], 0);
          end_date = end_date.toISOString().slice(0, 19).replace("T", " ");
          var sql3 =
            "INSERT INTO events (task_id, start_date, end_date, description) VALUES (?, ?, ?, ?)";
          await con2.query(sql3, [
            result.insertId,
            start_date,
            end_date,
            description,
          ]);
        }
      }

      if (alert_active && has_time) {
        insertRecurrentAlert(start_time, days, result.insertId, alert_text);
      }
      res.json({ status: "OK", data: "Task has been added successfully." });
    },
  );
});

router.post("/api/update-recurrent-task-done", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({ status: "NOK", error: "Invalid Authorization." });
    return;
  }
  var task_id = req.body.task_id;
  var is_done = req.body.is_done;
  var date = req.body.date;
  var sql = "SELECT * FROM recurrent_checks WHERE task_id = ? AND date = ?";
  con.query(sql, [task_id, date], function (err, result) {
    if (err) {
      console.log(err);
      res.json({ status: "NOK", error: err.message });
      return;
    }
    if (result.length > 0) {
      var sql2 =
        "UPDATE recurrent_checks SET is_done = ? WHERE task_id = ? AND date = ?";
      con.query(sql2, [is_done, task_id, date], function (err, result) {
        if (err) {
          console.log(err);
          res.json({ status: "NOK", error: err.message });
        }
        res.json({ status: "OK", data: "Task has been updated successfully." });
      });
    } else {
      var sql2 =
        "INSERT INTO recurrent_checks (task_id, date, is_done) VALUES (?, ?, ?)";
      con.query(sql2, [task_id, date, is_done], function (err, result) {
        if (err) {
          console.log(err);
          res.json({ status: "NOK", error: err.message });
        }
        res.json({ status: "OK", data: "Task has been updated successfully." });
      });
    }
  });
});

router.post("/api/edit-recurrent-task", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({ status: "NOK", error: "Invalid Authorization." });
    return;
  }
  var task_id = req.body.task_id;
  var description = req.body.description;
  var start_time = req.body.start_time;
  var end_time = req.body.end_time;
  var days = req.body.days;
  var alert_active = req.body.alert_active;
  var alert_text = req.body.alert_text;

  var start_time2;
  var end_time2;
  var has_time = false;
  if (
    typeof start_time == "undefined" ||
    start_time == "" ||
    typeof end_time == "undefined" ||
    end_time == ""
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

  var sql =
    "UPDATE tasks SET description = ?, start_time = ?, end_time = ?, days = ? WHERE id = ?";
  con.query(
    sql,
    [description, start_time2, end_time2, days, task_id],
    async function (err, result) {
      if (err) {
        console.log(err);
        res.json({ status: "NOK", error: err.message });
        return;
      }

      var sql2 =
        "DELETE FROM recurrent_checks WHERE task_id = ? AND date > DATE(NOW())";
      await con2.query(sql2, [task_id]);
      var sql3 =
        "DELETE FROM events WHERE task_id = ? AND start_date > DATE(NOW())";
      await con2.query(sql3, [task_id]);

      var dates = utils.getDatesUntilNextYear(days);

      for (var i in dates) {
        var sql2 =
          "INSERT INTO recurrent_checks (task_id, date, is_done) VALUES (?, ?, 0)";
        await con2.query(sql2, [task_id, dates[i].toISOString().slice(0, 10)]);

        if (has_time) {
          var start_date = dates[i];
          var st = start_time.split(" ")[1].split(":");
          start_date.setHours(st[0], st[1], 0);
          start_date = start_date.toISOString().slice(0, 19).replace("T", " ");
          var end_date = dates[i];
          var et = end_time.split(" ")[1].split(":");
          end_date.setHours(et[0], et[1], 0);
          end_date = end_date.toISOString().slice(0, 19).replace("T", " ");
          var sql3 =
            "INSERT INTO events (task_id, start_date, end_date, description) VALUES (?, ?, ?, ?)";
          await con2.query(sql3, [task_id, start_date, end_date, description]);
        }
      }

      if (alert_active && has_time) {
        upsertRecurrentAlert(start_time, days, task_id, alert_text);
      }

      if (!alert_active) {
        deleteRecurrentAlert(task_id);
      }

      res.json({ status: "OK", data: "Task has been updated successfully." });
    },
  );
});

router.post("/api/restart-recurrent-task", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({ status: "NOK", error: "Invalid Authorization." });
    return;
  }

  var task_id = req.body.task_id;
  var now = new Date();
  var now_date = utils.toLocaleISOString(now).slice(0, 10);
  var now_datetime = utils.toLocaleISOString(now);

  var sql = "DELETE FROM recurrent_checks WHERE task_id = ? AND date < ?";
  await con2.query(sql, [task_id, now_date]);

  var sql2 =
    "DELETE FROM events WHERE task_id = ? AND start_date < DATE(NOW())";
  await con2.query(sql2, [task_id]);

  var sql3 = "UPDATE tasks SET created_at = ? WHERE id = ?";
  await con2.query(sql3, [now_datetime, task_id]);

  res.json({ status: "OK", data: "Recurrent task has been restarted." });
});

router.post("/api/cancel-task", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({ status: "NOK", error: "Invalid Authorization." });
    return;
  }

  var task_id = req.body.task_id;
  var dt = req.body.date;

  var sql = "SELECT * FROM recurrent_checks WHERE task_id = ? AND date = ?";
  con.query(sql, [task_id, dt], function (err, result) {
    if (err) {
      console.log(err);
      res.json({ status: "NOK", error: err.message });
      return;
    }
    if (result.length > 0) {
      if (result[0].is_done == 1) {
        res.json({ status: "NOK", error: "Task has already been done." });
        return;
      } else {
        var sql2 =
          "UPDATE recurrent_checks SET is_cancelled = 1 WHERE task_id = ? AND date = ?";
        con.query(sql2, [task_id, dt], function (err2, result2) {
          if (err2) {
            console.log(err2);
            res.json({ status: "NOK", error: err2.message });
          }
          res.json({
            status: "OK",
            data: "Task has been cancelled successfully.",
          });
          return;
        });
      }
    } else {
      var sql2 =
        "INSERT INTO recurrent_checks (task_id, date, is_cancelled, is_done) VALUES (?, ?, 1, 0)";
      con.query(sql2, [task_id, dt], function (err2, result2) {
        if (err2) {
          console.log(err2);
          res.json({ status: "NOK", error: err2.message });
        }
        res.json({
          status: "OK",
          data: "Task has been cancelled successfully.",
        });
        return;
      });
    }
  });
});

router.post("/api/uncancel-task", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({ status: "NOK", error: "Invalid Authorization." });
    return;
  }

  var task_id = req.body.task_id;
  var dt = req.body.date;

  var sql = "SELECT * FROM recurrent_checks WHERE task_id = ? AND date = ?";
  con.query(sql, [task_id, dt], function (err, result) {
    if (err) {
      console.log(err);
      res.json({ status: "NOK", error: err.message });
      return;
    }
    if (result.length > 0) {
      if (result[0].is_done == 1) {
        res.json({ status: "NOK", error: "Task has already been done." });
        return;
      } else {
        var sql2 =
          "UPDATE recurrent_checks SET is_cancelled = 0 WHERE task_id = ? AND date = ?";
        con.query(sql2, [task_id, dt], function (err2, result2) {
          if (err2) {
            console.log(err2);
            res.json({ status: "NOK", error: err2.message });
          }
          res.json({
            status: "OK",
            data: "Task has been uncancelled successfully.",
          });
          return;
        });
      }
    } else {
      var sql2 =
        "INSERT INTO recurrent_checks (task_id, date, is_cancelled, is_done) VALUES (?, ?, 0, 0)";
      con.query(sql2, [task_id, dt], function (err2, result2) {
        if (err2) {
          console.log(err2);
          res.json({ status: "NOK", error: err2.message });
        }
        res.json({
          status: "OK",
          data: "Task has been uncancelled successfully.",
        });
        return;
      });
    }
  });
});

module.exports = router;
