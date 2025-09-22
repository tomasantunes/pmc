var express = require('express');
var database = require('../libs/database');
var router = express.Router();

var {con, con2 } = database.getMySQLConnections();

router.post("/api/add-event", (req, res) => {
  var start_date = req.body.start;
  var end_date = req.body.end;
  var description = req.body.value;

  var sql = "INSERT INTO events (start_date, end_date, description) VALUES (?, ?, ?)";
  con.query(sql, [start_date, end_date, description], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err});
    }
    res.json({status: "OK", data: {message: "Event has been added successfully.", id: result.insertId}});
  });
});

router.get("/api/get-events", (req, res) => {
  var sql = "SELECT description AS value, start_date AS start, end_date AS end FROM events";
  con.query(sql, function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err});
    }
    res.json({status: "OK", data: result});
  });
});

module.exports = router;