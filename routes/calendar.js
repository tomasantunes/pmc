var express = require('express');
var database = require('../libs/database');
var router = express.Router();

var {con, con2 } = database.getMySQLConnections();

router.post("/api/add-event", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var start_date = req.body.start;
  var end_date = req.body.end;
  var description = req.body.value;

  var sql = "INSERT INTO events (start_date, end_date, description, user_id) VALUES (?, ?, ?, ?)";
  con.query(sql, [start_date, end_date, description, req.session.userId], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err});
    }
    res.json({status: "OK", data: {message: "Event has been added successfully.", id: result.insertId}});
  });
});

router.post("/api/edit-event", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var id = req.body.id;
  var start_date = req.body.start;
  var end_date = req.body.end;
  var description = req.body.title;

  var sql = "UPDATE events SET start_date = ?, end_date = ?, description = ? WHERE id = ? AND user_id = ?";
  con.query(sql, [start_date, end_date, description, id, req.session.userId], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err});
    }
    res.json({status: "OK", data: {message: "Event has been updated successfully."}});
  });
});

router.post("/api/delete-event", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var id = req.body.id;
  var sql = "DELETE FROM events WHERE id = ? AND user_id = ?";
  con.query(sql, [id, req.session.userId], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err});
    }
    res.json({status: "OK", data: {message: "Event has been deleted successfully."}});
  });
});

router.get("/api/get-events", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  
  var sql = "SELECT id, description AS value, start_date AS start, end_date AS end FROM events WHERE user_id = ?";
  con.query(sql, [req.session.userId], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err});
    }
    res.json({status: "OK", data: result});
  });
});

module.exports = router;