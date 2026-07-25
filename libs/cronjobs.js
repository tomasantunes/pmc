const cron = require("node-cron");
const { sendEmail } = require("./email");
const database = require("./database");
const secretConfig = require("../secret-config");

var { con2 } = database.getMySQLConnections();
var cronjobs_arr = [];
var cronTimezone = secretConfig.TIMEZONE || "Europe/Lisbon";

async function loadCron() {
  for (var i in cronjobs_arr) {
    cronjobs_arr[i].task.stop();
  }
  cronjobs_arr = [];

  var sql =
    "SELECT alerts.*, COALESCE(users.email, ?) AS email " +
    "FROM alerts LEFT JOIN users ON alerts.user_id = users.id";

  try {
    var [result] = await con2.query(sql, [secretConfig.RECIPIENT_EMAIL]);

    result.forEach((item) => {
      const cronjob = cron.schedule(item.cron_string, async () => {
        console.log(`Triggered cron email alert ${item.id}.`);
        const sent = await sendEmail("PMC Alert", item.text, item.email);
        if (!sent) {
          console.error(`Email delivery failed for alert ${item.id}.`);
        }
      }, {
        timezone: cronTimezone,
      });

      cronjobs_arr.push({
        alertId: item.id,
        userId: item.user_id,
        task: cronjob,
      });
    });
  } catch (err) {
    console.error("Unable to load cron email alerts:", err);
  }
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
