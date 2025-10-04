var express = require('express');
var database = require('../libs/database');
var utils = require('../libs/utils');
var tasks = require('../libs/tasks');
var router = express.Router();

var {con, con2 } = database.getMySQLConnections();

router.get("/api/get-task-list", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var task_list = await tasks.getTaskList();
  res.json({status: "OK", data: task_list});
});

router.get("/api/get-tasks-from-folder", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var folder_id = req.query.folder_id;
  var sql = "SELECT *, CONCAT(start_time, ' - ', end_time) AS time FROM tasks WHERE folder_id = ? ORDER BY sort_index ASC";
  con.query(sql, [folder_id], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
    }

    for (var i in result) {
      if (result[i].time == "1970-01-01 01:00:00 - 1970-01-01 01:00:00" || result[i].time == "1970-01-01 00:00:00 - 1970-01-01 00:00:00") {
        result[i].time = "";
      }
    }
    res.json({status: "OK", data: result});
  });
});



router.post("/api/update-task-done", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var task_id = req.body.task_id;
  var is_done = req.body.is_done;
  var date_done = req.body.date_done;
  var sql = "UPDATE tasks SET is_done = ? WHERE id = ?";
  con.query(sql, [is_done, task_id], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
    }
    if (is_done == true) {
      var sql2 = "UPDATE tasks SET date_done = ? WHERE id = ?";
      con.query(sql2, [date_done, task_id]);
    }
    res.json({status: "OK", data: "Task has been updated successfully."});
  });
});

router.post("/api/update-all-tasks-done", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var folder_id = req.body.folder_id;
  var is_done = req.body.is_done;

  var sql = "UPDATE tasks SET is_done = ? WHERE folder_id = ?";
  con.query(sql, [is_done, folder_id], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
      return;
    }
    res.json({status: "OK", data: "Tasks have been updated successfully."});
  });
});

router.post("/api/add-task", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var folder_id = req.body.folder_id;
  var description = req.body.description;
  var start_time = req.body.start_time;
  var end_time = req.body.end_time;
  var sort_index = req.body.sort_index;

  console.log(start_time);
  console.log(end_time);

  if (typeof start_time == "undefined" || start_time == "" || start_time == null || typeof end_time == "undefined" || end_time == "" || end_time == null) {
    start_time = utils.toLocaleISOString(new Date('1970-01-01Z00:00:00:000')).slice(0, 19).replace('T', ' ');
    end_time = utils.toLocaleISOString(new Date('1970-01-01Z00:00:00:000')).slice(0, 19).replace('T', ' ');
  }

  var sql = "INSERT INTO tasks (folder_id, description, start_time, end_time, is_done, sort_index) VALUES (?, ?, ?, ?, ?, ?)";
  con.query(sql, [folder_id, description, start_time, end_time, 0, sort_index], async function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
    }

    var sql2 = "INSERT INTO events (task_id, start_date, end_date, description) VALUES (?, ?, ?, ?)";
    await con2.query(sql2, [result.insertId, start_time, end_time, description]);

    res.json({status: "OK", data: "Task has been added successfully."});
  });
});

router.post("/api/handle-sort", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var task_id = req.body.task_id;
  var sort_index = req.body.sort_index;
  var sql = "UPDATE tasks SET sort_index = ? WHERE id = ?";
  con.query(sql, [sort_index, task_id], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
    }
    res.json({status: "OK", data: "Task has been updated successfully."});
  });
});

router.get("/api/get-task", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var task_id = req.query.task_id;
  var sql = "SELECT * FROM tasks WHERE id = ?";
  con.query(sql, [task_id], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
    }
    res.json({status: "OK", data: result[0]});
  });
});

router.post("/api/edit-task", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var task_id = req.body.task_id;
  var description = req.body.description;
  var start_time = req.body.start_time;
  var end_time = req.body.end_time;

  if (typeof start_time == "undefined" || start_time == "" || typeof end_time == "undefined" || end_time == "") {
    start_time = new Date('1970-01-01Z00:00:00:000').toISOString().slice(0, 19).replace('T', ' ');
    end_time = new Date('1970-01-01Z00:00:00:000').toISOString().slice(0, 19).replace('T', ' ');
  }

  var sql = "UPDATE tasks SET description = ?, start_time = ?, end_time = ? WHERE id = ?";
  con.query(sql, [description, start_time, end_time, task_id], async function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
    }

    var sql2 = "UPDATE events SET start_date = ?, end_date = ?, description = ? WHERE task_id = ?";
    await con2.query(sql2, [start_time, end_time, description, task_id]);

    res.json({status: "OK", data: "Task has been updated successfully."});
  });
});

router.post("/api/delete-task", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var task_id = req.body.task_id;
  var sql = "DELETE FROM tasks WHERE id = ?";
  con.query(sql, [task_id], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
    }
    var sql2 = "DELETE FROM recurrent_checks WHERE task_id = ?";
    con.query(sql2, [task_id], function (err2, result2) {
      if (err2) {
        console.log(err2);
        res.json({status: "NOK", error: err2.message});
      }

      var sql3 = "DELETE FROM events WHERE task_id = ?";
      con.query(sql3, [task_id], function (err3, result3) {
        if (err3) {
          console.log(err3);
          res.json({status: "NOK", error: err3.message});
        }
        res.json({status: "OK", data: "Task has been deleted successfully."});
      });
    });
  });
});

router.get("/api/get-random-task", (req, res) => {
  var sql = "SELECT description FROM tasks WHERE is_done = 0 ORDER BY RAND() LIMIT 1";
  con.query(sql, function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err});
    }
    res.json({status: "OK", data: result[0].description});
  });
});

module.exports = router;