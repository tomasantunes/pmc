var express = require('express');
var { listCronJobs } = require('../libs/cronjobs');
var { listAlerts } = require('../libs/alerts');
var router = express.Router();

router.get("/list-cron-jobs", (req, res) => {
  if (!req.session.isLoggedIn) {
    return res.json({ status: "NOK", error: "Invalid Authorization." });
  }

  var cronjobs = listCronJobs();
  var result = [];

  for (var i in cronjobs) {
    if (cronjobs[i].userId === req.session.userId) {
      result.push({
        idx: i,
        id: cronjobs[i].alertId,
        nextRun: cronjobs[i].task.getNextRun(),
      });
    }
  }

  try {
    res.json({ status: "OK", data: result });
  } catch(e) {
    console.log(e);
    res.json({status: "NOK", error: JSON.stringify(e)})
  }
});

router.get("/list-alerts", async (req, res) => {
  if (!req.session.isLoggedIn) {
    return res.json({ status: "NOK", error: "Invalid Authorization." });
  }

  var alerts = await listAlerts(req.session.userId);
  var cronjobs = listCronJobs();
  var nextRuns = new Map(
    cronjobs
      .filter((cronjob) => cronjob.userId === req.session.userId)
      .map((cronjob) => [cronjob.alertId, cronjob.task.getNextRun()])
  );
  alerts = alerts.map((alert) => ({
    ...alert,
    nextRun: nextRuns.get(alert.id) || null,
  }));
  res.json({ status: "OK", data: alerts });
});

module.exports = router;
