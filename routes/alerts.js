var express = require('express');
var { listCronJobs } = require('../libs/cronjobs');
var router = express.Router();

router.get("/list-cron-jobs", (req, res) => {
  if (!req.session.isLoggedIn) {
    return res.json({ status: "NOK", error: "Invalid Authorization." });
  }

  var cronjobs = listCronJobs();
  var result = [];

  for (var i in cronjobs) {
    result.push({idx: i, id: cronjobs[i].id, nextRun: cronjobs[i].getNextRun()})
  }

  try {
    res.json({ status: "OK", data: result });
  } catch(e) {
    console.log(e);
    res.json({status: "NOK", error: JSON.stringify(e)})
  }
});

module.exports = router;
