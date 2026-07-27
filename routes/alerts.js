var express = require('express');
var cron = require("node-cron");
var { listCronJobs } = require('../libs/cronjobs');
var { listAlerts, updateAlert, deleteAlert } = require('../libs/alerts');
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

router.post("/edit-alert", async (req, res) => {
  if (!req.session.isLoggedIn) {
    return res.json({ status: "NOK", error: "Invalid Authorization." });
  }

  var id = Number(req.body.id);
  var cronString = String(req.body.cron_string || "").trim();
  var text = String(req.body.text || "").trim();
  if (!Number.isInteger(id) || id < 1 || !cron.validate(cronString) || !text) {
    return res.json({ status: "NOK", error: "Invalid alert." });
  }

  var affectedRows = await updateAlert(
    id,
    cronString,
    text,
    req.session.userId,
  );
  if (affectedRows < 1) {
    return res.json({ status: "NOK", error: "Alert not found." });
  }
  res.json({ status: "OK" });
});

router.post("/delete-alert", async (req, res) => {
  if (!req.session.isLoggedIn) {
    return res.json({ status: "NOK", error: "Invalid Authorization." });
  }

  var id = Number(req.body.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.json({ status: "NOK", error: "Invalid alert." });
  }

  var affectedRows = await deleteAlert(id, req.session.userId);
  if (affectedRows < 1) {
    return res.json({ status: "NOK", error: "Alert not found." });
  }
  res.json({ status: "OK" });
});

module.exports = router;
