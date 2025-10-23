var express = require('express');
var database = require('../libs/database');
var utils = require('../libs/utils');
var tasks = require('../libs/tasks');
var router = express.Router();

var {con, con2 } = database.getMySQLConnections();

router.get("/api/get-daily-todo", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var folder_id = req.query.folder_id;
  var dt = req.query.dt;

  var sql = "SELECT * FROM daily_todos_tasks WHERE folder_id = ? AND tdate = ?";

  con.query(sql, [folder_id, dt], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
      return;
    }
    console.log(result);
    res.json({status: "OK", data: result});
  });
});

router.post("/api/add-daily-todo-task", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var folder_id = req.body.folder_id;
  var description = req.body.description;
  var tdate = req.body.tdate;
  var sort_index = req.body.sort_index;
  var is_done = req.body.is_done;

  var sql = "INSERT INTO daily_todos_tasks (folder_id, description, tdate, sort_index, is_done) VALUES (?, ?, ?, ?, ?)";
  con.query(sql, [folder_id, description, tdate, sort_index, is_done], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
      return;
    }
    res.json({status: "OK", data: result});
  });
});

module.exports = router;