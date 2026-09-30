var express = require('express');
var database = require('../libs/database');
var { insertEventAlert } = require('../libs/alerts');
var router = express.Router();

var {con, con2 } = database.getMySQLConnections();

router.post("/api/add-event", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var start_date = req.body.start;
  var end_date = req.body.end;
  var description = req.body.value;
  var alert_active = req.body.alert_active === true;
  var alert_text = req.body.alert_text || "";
  var alert_minutes_before = Number(req.body.alert_minutes_before);

  if (
    alert_active &&
    (!Number.isInteger(alert_minutes_before) || alert_minutes_before < 0)
  ) {
    res.json({status: "NOK", error: "Invalid alert time."});
    return;
  }

  var sql = "INSERT INTO events (start_date, end_date, description, user_id) VALUES (?, ?, ?, ?)";
  try {
    var [result] = await con2.query(sql, [start_date, end_date, description, req.session.userId]);
    if (alert_active) {
      await insertEventAlert(
        start_date,
        alert_minutes_before,
        alert_text,
        req.session.userId,
      );
    }
    res.json({status: "OK", data: {message: "Event has been added successfully.", id: result.insertId}});
  } catch (err) {
    console.error("Unable to add event:", err);
    res.status(500).json({status: "NOK", error: "Unable to add event."});
  }
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
      console.error("Unable to update event:", err);
      return res.status(500).json({status: "NOK", error: "Unable to update event."});
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
      console.error("Unable to delete event:", err);
      return res.status(500).json({status: "NOK", error: "Unable to delete event."});
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
      console.error("Unable to retrieve events:", err);
      return res.status(500).json({status: "NOK", error: "Unable to retrieve events."});
    }
    res.json({status: "OK", data: result});
  });
});

module.exports = router;
