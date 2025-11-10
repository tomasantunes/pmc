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
  var sql = "SELECT  * FROM alerts";
  con.query(sql, function (err, result) {
    if (err) {
      console.log(err);
      return false;
    }

    for (var i in result) {
      var cronjob = cron.schedule(result[i].cron_string, () => {
        console.log("Triggered cron email alert.");
        sendEmail(result[i].text);
      });
      cronjobs_arr.push(cronjob);
    }
  });
}

module.exports = {
  loadCron,
  default: {
    loadCron,
  },
};
