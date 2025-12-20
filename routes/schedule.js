var express = require('express');
var database = require('../libs/database');
var utils = require('../libs/utils');
var router = express.Router();

var {con, con2 } = database.getMySQLConnections();

router.get("/api/get-schedule", (req, res) => {
  var last_monday = utils.toLocaleISOString(utils.previousMonday());
  var next_sunday = utils.toLocaleISOString(utils.nextDate(7));

  var sql = "SELECT * FROM events WHERE start_date BETWEEN ? AND ? AND user_id = ? ORDER BY start_date ASC";
  con.query(sql, [last_monday, next_sunday, req.session.userId], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err});
    }
    res.json({status: "OK", data: result});
  });
});

module.exports = router;
