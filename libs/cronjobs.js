const cron = require("node-cron");
const { sendEmail } = require("./email");
const database = require("./database");
const secretConfig = require("../secret-config");

var { con, con2 } = database.getMySQLConnections();
var cronjobs_arr = [];

function loadCron() {
  for (var i in cronjobs_arr) {
    cronjobs_arr[i].stop();
  }
  cronjobs_arr = [];
  var sql = "SELECT alerts.*, users.email FROM alerts INNER JOIN users ON alerts.user_id = users.id";
  con.query(sql, function (err, result) {
    if (err) {
      console.log(err);
      return false;
    }

    result.forEach(item => {
      const cronjob = cron.schedule(item.cron_string, () => {
        console.log("Triggered cron email alert.");
        sendEmail(item.text, item.email);
      });

      cronjobs_arr.push(cronjob);
    });
  });
}

function listCronJobs() {
  return cronjobs_arr;
}

module.exports = {
  loadCron,
  listCronJobs,
  default: {
    loadCron,
    listCronJobs
  },
};
