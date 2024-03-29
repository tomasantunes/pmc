var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('mysql2');
var mysql2 = require('mysql2/promise');
var secretConfig = require('./secret-config');
var session = require('express-session');
const { Octokit } = require("@octokit/rest");
const OpenAI = require("openai");
var axios = require('axios');
var moment = require("moment");

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: secretConfig.SESSION_KEY,
  resave: false,
  saveUninitialized: true
}));

const octokit = new Octokit({
  auth: secretConfig.GITHUB_TOKEN,
  userAgent: 'myApp v1.2.3',
  previews: ['jean-grey', 'symmetra'],
  timeZone: 'Europe/Lisbon',
  baseUrl: 'https://api.github.com',
  log: {
    debug: () => {},
    info: () => {},
    warn: console.warn,
    error: console.error
  },
  request: {
    agent: undefined,
    fetch: undefined,
    timeout: 0
  }
});

var con;
var con2;
if (secretConfig.ENVIRONMENT == "WINDOWS" || secretConfig.ENVIRONMENT == "MACOS") {
  con = mysql.createPool({
    connectionLimit : 90,
    connectTimeout: 1000000,
    host: secretConfig.DB_HOST,
    user: secretConfig.DB_USER,
    password: secretConfig.DB_PASSWORD,
    database: secretConfig.DB_NAME,
    timezone: '+01:00',
    port: 3306,
    dateStrings: true
  });

  con2 = mysql2.createPool({
    connectionLimit : 90,
    connectTimeout: 1000000,
    host: secretConfig.DB_HOST,
    user: secretConfig.DB_USER,
    password: secretConfig.DB_PASSWORD,
    database: secretConfig.DB_NAME,
    timezone: '+01:00',
    port: 3306,
    dateStrings: true
  });
}
else if (secretConfig.ENVIRONMENT == "UBUNTU") {
  con = mysql.createPool({
    connectionLimit : 90,
    connectTimeout: 1000000,
    host: secretConfig.DB_HOST,
    user: secretConfig.DB_USER,
    password: secretConfig.DB_PASSWORD,
    database: secretConfig.DB_NAME,
    socketPath: '/var/run/mysqld/mysqld.sock',
    timezone: '+01:00',
    dateStrings: true
  });

  con2 = mysql2.createPool({
    connectionLimit : 90,
    connectTimeout: 1000000,
    host: secretConfig.DB_HOST,
    user: secretConfig.DB_USER,
    password: secretConfig.DB_PASSWORD,
    database: secretConfig.DB_NAME,
    socketPath: '/var/run/mysqld/mysqld.sock',
    timezone: '+01:00',
    dateStrings: true
  });
}

const configuration = {
  apiKey: secretConfig.OPENAI_API_KEY,
};

const openai = new OpenAI(configuration);

async function getTaskList() {
  var sql = "SELECT description FROM tasks WHERE is_done = 0";

  const [rows, fields] = await con2.execute(sql);
  var arr = rows.map(a => a.description);
  return arr;
}

async function getMotivationalText(messages) {
  var task_list = await getTaskList();
  var prompt = "Generate a motivational text to help me do my tasks and get productive based on the following task list: ";
  prompt += task_list.join(", ");
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{"role": "user", "content": prompt}],
  });
  console.log(completion.choices[0].message);
  var message = completion.choices[0].message;
  return message.content;
}

Date.prototype.addDays = function(days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
}

app.get("/api/generate-motivational-text", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var motivational_text = await getMotivationalText();
  motivational_text = motivational_text.replace(/(?:\r\n|\r|\n)/g, '<br>');
  res.json({status: "OK", data: motivational_text});
});

app.get("/api/get-task-list", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var task_list = await getTaskList();
  res.json({status: "OK", data: task_list});
});

app.get("/api/get-folders", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var sql = "SELECT * FROM folders";
  con.query(sql, function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
    }
    res.json({status: "OK", data: result});
  });
});

app.get("/api/get-folder", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var folder_id = req.query.folder_id;
  var sql = "SELECT * FROM folders WHERE id = ?";
  con.query(sql, [folder_id], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
    }
    res.json({status: "OK", data: result[0]});
  });
});

app.post("/api/edit-folder-name", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var folder_id = req.body.folder_id;
  var name = req.body.name;
  var sql = "UPDATE folders SET name = ? WHERE id = ?";
  con.query(sql, [name, folder_id], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
    }
    res.json({status: "OK", data: "Folder name has been updated successfully."});
  });
});

app.get("/api/get-tasks-from-folder", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var folder_id = req.query.folder_id;
  var sql = "SELECT *, CONCAT(start_time, ' - ', end_time) AS time FROM tasks WHERE folder_id = ? ORDER BY sort_index ASC";
  con.query(sql, [folder_id], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
    }
    res.json({status: "OK", data: result});
  });
});

app.post("/api/delete-folder", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var folder_id = req.body.folder_id;
  var sql = "DELETE FROM folders WHERE id = ?";
  con.query(sql, [folder_id], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
    }
    var sql2 = "DELETE FROM tasks WHERE folder_id = ?";
    con.query(sql2, [folder_id], function (err2, result2) {
      if (err2) {
        console.log(err2);
        res.json({status: "NOK", error: err2.message});
      }
      var sql3 = "DELETE FROM recurrent_checks WHERE task_id IN (SELECT id FROM tasks WHERE folder_id = ?)";
      con.query(sql3, [folder_id], function (err3, result3) {
        if (err3) {
          console.log(err3);
          res.json({status: "NOK", error: err3.message});
        }
        res.json({status: "OK", data: "Folder has been deleted successfully."});
      });
    });
  });
});

app.post("/api/set-hide-done", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var folder_id = req.body.folder_id;
  var hide_done = req.body.hide_done;
  var sql = "UPDATE folders SET hide_done = ? WHERE id = ?";
  con.query(sql, [hide_done, folder_id], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
    }
    res.json({status: "OK", data: "Folder has been updated successfully."});
  });
});

function getRangeOfDates(startDate, stopDate) {
  var dateArray = new Array();
  var currentDate = startDate;
  while (currentDate <= stopDate) {
      dateArray.push(new Date (currentDate));
      currentDate = currentDate.addDays(1);
  }
  return dateArray;
}

app.get("/api/get-recurrent-tasks", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var folder_id = req.query.folder_id;
  var dti = req.query.dti;
  var dtf = req.query.dtf;
  var sql = "SELECT *, CONCAT(DATE_FORMAT(start_time, '%H:%i'), ' - ', DATE_FORMAT(end_time, '%H:%i')) AS time FROM tasks WHERE folder_id = ? ORDER BY sort_index ASC";
  con.query(sql, [folder_id], async function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
    }

    for (var i in result) {
      var task_id = result[i].id;
      var checks = await getTaskChecks(task_id, dti, dtf);
      result[i].checks = checks;

      var dt_range = getRangeOfDates(new Date(dti), new Date(dtf));
      for (var i in dt_range) {
        var dt = dt_range[i];
        var wd = dt.getDay();
        var is_cancelled = await checkIfTaskIsCancelled(task_id, dt.toISOString().slice(0, 10));
        if (is_cancelled) {
          var days = result[i].days.split(",");
          var idx_to_remove = days.indexOf(wd.toString());
          days.splice(idx_to_remove, 1);
          result[i].days = days.join(",");
        }
      }
    }
    res.json({status: "OK", data: result});
  });
});

app.post("/api/add-recurrent-task", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var folder_id = req.body.folder_id;
  var description = req.body.description;
  var start_time = req.body.start_time;
  var end_time = req.body.end_time;
  var days = req.body.days;
  var sort_index = req.body.sort_index;

  var start_time2;
  var end_time2;
  var has_time = false;
  if (typeof start_time == "undefined" || start_time == "" || typeof end_time == "undefined" || end_time == "") {
    start_time2 = new Date('1970-01-01Z00:00:00:000').toISOString().slice(0, 19).replace('T', ' ');
    end_time2 = new Date('1970-01-01Z00:00:00:000').toISOString().slice(0, 19).replace('T', ' ');
  }
  else {
    var dt1 = new Date();
    var t1 = start_time.split(":");
    dt1.setHours(t1[0], t1[1], 0);
    start_time2 = dt1.toISOString().slice(0, 19).replace('T', ' ');
    var dt2 = new Date();
    var t2 = end_time.split(":");
    dt2.setHours(t2[0], t2[1], 0);
    end_time2 = dt2.toISOString().slice(0, 19).replace('T', ' ');
    has_time = true;
  }
  
  var sql = "INSERT INTO tasks (folder_id, description, start_time, end_time, type, days, sort_index, is_done) VALUES (?, ?, ?, ?, ?, ?, ?, 0)";
  con.query(sql, [folder_id, description, start_time2, end_time2, "recurrent", days, sort_index], async function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
    }
    
    var dates = getDatesUntilNextYear(days);

    console.log(dates);

    for (var i in dates) {
      var sql2 = "INSERT INTO recurrent_checks (task_id, date, is_done) VALUES (?, ?, 0)";
      await con2.query(sql2, [result.insertId, dates[i].toISOString().slice(0, 10)]);

      if (has_time) {
        var start_date = dates[i];
        var st = start_time.split(":");
        start_date.setHours(st[0], st[1], 0);
        start_date = start_date.toISOString().slice(0, 19).replace('T', ' ');
        var end_date = dates[i];
        var et = end_time.split(":");
        end_date.setHours(et[0], et[1], 0);
        end_date = end_date.toISOString().slice(0, 19).replace('T', ' ');
        console.log(start_date);
        console.log(end_date);
        var sql3 = "INSERT INTO events (task_id, start_date, end_date, description) VALUES (?, ?, ?, ?)";
        await con2.query(sql3, [result.insertId, start_date, end_date, description]);
      }
    }
    res.json({status: "OK", data: "Task has been added successfully."});
  });
});

function getDatesUntilNextYear(days) {
  var d = new Date();
  var year_i = d.getFullYear();

  var days = days.split(",");
  days = days.map(Number);

  dates_to_push = [];

  // Get all the days of the current year that are in the array "days"
  while (d.getFullYear() === year_i) {
    var wd = d.getDay();
    if (days.includes(wd)) {
      var pushDate = new Date(d.getTime());
      dates_to_push.push(pushDate);
    }
    d.setDate(d.getDate() + 1);
  }

  return dates_to_push;
}

async function getTaskChecks(task_id, dti, dtf) {
  var sql = "SELECT * FROM recurrent_checks WHERE task_id = ? AND date BETWEEN ? AND ?";
  const [rows, fields] = await con2.execute(sql, [task_id, dti, dtf]);
  return rows;
}

app.post("/api/add-folder", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var name = req.body.name;
  var type = req.body.type;
  var sql = "INSERT INTO folders (name, type) VALUES (?, ?)";
  con.query(sql, [name, type], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
    }
    res.json({status: "OK", data: {message: "Folder has been added successfully.", insertId: result.insertId}});
  });
});

app.get("/api/get-stats", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var recurrent_types = ["daily", "weekly", "monthly", "yearly", "week_day", "month_day", "year_day"];

  var sql = "SELECT COUNT(*) FROM tasks WHERE type='single'";
  con.query(sql, function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
    }
    var total_tasks = result[0]["COUNT(*)"];
    var sql2 = "SELECT COUNT(*) FROM tasks WHERE type='single' AND is_done = 1";
    con.query(sql2, function (err2, result2) {
      if (err) {
        console.log(err);
        res.json({status: "NOK", error: err.message});
      }
      var total_tasks_done = result2[0]["COUNT(*)"];
      var sql3 = "SELECT * FROM tasks WHERE type IN (?)";
      con.query(sql3, [recurrent_types], function (err3, result3) {
        if (err) {
          console.log(err);
          res.json({status: "NOK", error: err.message});
        }
        getTodayTasks(result3, function(today_tasks) {
          if (today_tasks.length > 0) {
            var sql4 = "SELECT * FROM recurrent_checks WHERE task_id IN (?) AND is_done = 1 AND date = DATE(NOW())";
            con.query(sql4, [today_tasks], function (err4, result4) {
              if (err4) {
                console.log(err4);
                res.json({status: "NOK", error: err4.message});
              }
              var today_tasks_done = result4.length;
              res.json({status: "OK", data: {total_tasks: total_tasks, total_tasks_done: total_tasks_done, recurrent_tasks: today_tasks.length, recurrent_tasks_done: today_tasks_done}});
            });
          }
          else {
            res.json({status: "OK", data: {total_tasks: total_tasks, total_tasks_done: total_tasks_done, recurrent_tasks: 0, recurrent_tasks_done: 0}});
          }
        });
      });
    });
  });
});

app.get("/api/get-github-tasks", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var text = '';

  const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({per_page: 100});

  for (var i in repos) {
    var repo_name = repos[i].name;
    try {
      const {data: todo } = await octokit.rest.repos.getContent({
        owner: "tomasantunes",
        repo: repo_name,
        path: "TODO.md",
      });
      var response = await axios.get(todo.download_url);
      console.log(response.data);
      var lines = response.data.split('\n');
      text += '<h3>' + repo_name + '</h3><br/><br/>';
      for (var j in lines) {
        text += lines[j] + '<br/>';
      }
      text += '<br/><br/>';
    }
    catch (err) {
      console.log(err.message);
    }
  }

  res.json({status: "OK", data: text});
});

async function getTodayTasks(tasks, cb) {
  var today_tasks = [];
  for (var i in tasks) {
    if (await checkIfTaskIsToday(tasks[i])) {
      today_tasks.push(tasks[i].id);
    }
  }
  cb(today_tasks);
}

async function checkIfTaskIsToday(task) {
  var today = new Date();
  var dd = today.getDate();
  var wd = today.getDay() - 1;
  var mm = today.getMonth() + 1;

  var is_cancelled = await checkIfTaskIsCancelled(task.id, today.toISOString().slice(0, 10));

  var days = task.days.split(",");
  days = days.map(Number);
  if (days.includes(wd) && !is_cancelled) {
    return true;
  }
  return false;
}

app.post("/api/update-task-done", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var task_id = req.body.task_id;
  var is_done = req.body.is_done;
  var date_done = req.body.date_done;
  var sql = "UPDATE tasks SET is_done = ? WHERE id = ?";
  con.query(sql, [is_done, task_id], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
    }
    if (is_done == true) {
      var sql2 = "UPDATE tasks SET date_done = ? WHERE id = ?";
      con.query(sql2, [date_done, task_id]);
    }
    res.json({status: "OK", data: "Task has been updated successfully."});
  });
});

app.post("/api/update-all-tasks-done", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var folder_id = req.body.folder_id;
  var is_done = req.body.is_done;

  var sql = "UPDATE tasks SET is_done = ? WHERE folder_id = ?";
  con.query(sql, [is_done, folder_id], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
      return;
    }
    res.json({status: "OK", data: "Tasks have been updated successfully."});
  });
});

app.post("/api/update-recurrent-task-done", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var task_id = req.body.task_id;
  var is_done = req.body.is_done;
  var date = req.body.date;
  var sql = "SELECT * FROM recurrent_checks WHERE task_id = ? AND date = ?";
  con.query(sql, [task_id, date], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
    }
    if (result.length > 0) {
      var sql2 = "UPDATE recurrent_checks SET is_done = ? WHERE task_id = ? AND date = ?";
      con.query(sql2, [is_done, task_id, date], function (err, result) {
        if (err) {
          console.log(err);
          res.json({status: "NOK", error: err.message});
        }
        res.json({status: "OK", data: "Task has been updated successfully."});
      });
    }
    else {
      var sql2 = "INSERT INTO recurrent_checks (task_id, date, is_done) VALUES (?, ?, ?)";
      con.query(sql2, [task_id, date, is_done], function (err, result) {
        if (err) {
          console.log(err);
          res.json({status: "NOK", error: err.message});
        }
        res.json({status: "OK", data: "Task has been updated successfully."});
      });
    }
  });
});

app.post("/api/add-task", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var folder_id = req.body.folder_id;
  var description = req.body.description;
  var start_time = req.body.start_time;
  var end_time = req.body.end_time;
  var sort_index = req.body.sort_index;

  if (typeof start_time == "undefined" || start_time == "" || typeof end_time == "undefined" || end_time == "") {
    start_time = new Date('1970-01-01Z00:00:00:000').toISOString().slice(0, 19).replace('T', ' ');
    end_time = new Date('1970-01-01Z00:00:00:000').toISOString().slice(0, 19).replace('T', ' ');
  }

  var sql = "INSERT INTO tasks (folder_id, description, start_time, end_time, is_done, sort_index) VALUES (?, ?, ?, ?, 0, ?)";
  con.query(sql, [folder_id, description, start_time, end_time, sort_index], async function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
    }

    var sql2 = "INSERT INTO events (task_id, start_date, end_date, description) VALUES (?, ?, ?, ?)";
    await con2.query(sql2, [result.insertId, start_time, end_time, description]);

    res.json({status: "OK", data: "Task has been added successfully."});
  });
});

app.post("/api/handle-sort", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var task_id = req.body.task_id;
  var sort_index = req.body.sort_index;
  var sql = "UPDATE tasks SET sort_index = ? WHERE id = ?";
  con.query(sql, [sort_index, task_id], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
    }
    res.json({status: "OK", data: "Task has been updated successfully."});
  });
});

app.get("/api/get-task", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var task_id = req.query.task_id;
  var sql = "SELECT * FROM tasks WHERE id = ?";
  con.query(sql, [task_id], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
    }
    res.json({status: "OK", data: result[0]});
  });
});

app.post("/api/edit-task", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var task_id = req.body.task_id;
  var description = req.body.description;
  var start_time = req.body.start_time;
  var end_time = req.body.end_time;

  if (typeof start_time == "undefined" || start_time == "" || typeof end_time == "undefined" || end_time == "") {
    start_time = new Date('1970-01-01Z00:00:00:000').toISOString().slice(0, 19).replace('T', ' ');
    end_time = new Date('1970-01-01Z00:00:00:000').toISOString().slice(0, 19).replace('T', ' ');
  }

  var sql = "UPDATE tasks SET description = ?, start_time = ?, end_time = ? WHERE id = ?";
  con.query(sql, [description, start_time, end_time, task_id], async function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
    }

    var sql2 = "UPDATE events SET start_date = ?, end_date = ?, description = ? WHERE task_id = ?";
    await con2.query(sql2, [start_time, end_time, description, task_id]);

    res.json({status: "OK", data: "Task has been updated successfully."});
  });
});

app.post("/api/edit-recurrent-task", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var task_id = req.body.task_id;
  var description = req.body.description;
  var start_time = req.body.start_time;
  var end_time = req.body.end_time;
  var days = req.body.days;

  var start_time2;
  var end_time2;
  var has_time = false;
  if (typeof start_time == "undefined" || start_time == "" || typeof end_time == "undefined" || end_time == "") {
    start_time2 = new Date('1970-01-01Z00:00:00:000').toISOString().slice(0, 19).replace('T', ' ');
    end_time2 = new Date('1970-01-01Z00:00:00:000').toISOString().slice(0, 19).replace('T', ' ');
  }
  else {
    var dt1 = new Date();
    var t1 = start_time.split(":");
    dt1.setHours(t1[0], t1[1], 0);
    start_time2 = dt1.toISOString().slice(0, 19).replace('T', ' ');
    var dt2 = new Date();
    var t2 = end_time.split(":");
    dt2.setHours(t2[0], t2[1], 0);
    end_time2 = dt2.toISOString().slice(0, 19).replace('T', ' ');
    has_time = true;
  }

  var sql = "UPDATE tasks SET description = ?, start_time = ?, end_time = ?, days = ? WHERE id = ?";
  con.query(sql, [description, start_time2, end_time2, days, task_id], async function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
    }

    var sql2 = "DELETE FROM recurrent_checks WHERE task_id = ? AND date > DATE(NOW())";
    await con2.query(sql2, [task_id]);
    var sql3 = "DELETE FROM events WHERE task_id = ? AND start_date > DATE(NOW())";
    await con2.query(sql3, [task_id]);

    var dates = getDatesUntilNextYear(days);

    console.log(dates);

    for (var i in dates) {
      var sql2 = "INSERT INTO recurrent_checks (task_id, date, is_done) VALUES (?, ?, 0)";
      await con2.query(sql2, [task_id, dates[i].toISOString().slice(0, 10)]);

      if (has_time) {
        var start_date = dates[i];
        var st = start_time.split(":");
        start_date.setHours(st[0], st[1], 0);
        start_date = start_date.toISOString().slice(0, 19).replace('T', ' ');
        var end_date = dates[i];
        var et = end_time.split(":");
        end_date.setHours(et[0], et[1], 0);
        end_date = end_date.toISOString().slice(0, 19).replace('T', ' ');
        console.log(start_date);
        console.log(end_date);
        var sql3 = "INSERT INTO events (task_id, start_date, end_date, description) VALUES (?, ?, ?, ?)";
        await con2.query(sql3, [task_id, start_date, end_date, description]);
      }
    }

    res.json({status: "OK", data: "Task has been updated successfully."});
  });
});

async function checkIfTaskIsCancelled(task_id, dt) {
  var sql = "SELECT * FROM recurrent_checks WHERE task_id = ? AND date = ?";
  var [rows, fields] = await con2.execute(sql, [task_id, dt]);
  if (rows.length > 0) {
    if (rows[0].is_cancelled == 1) {
      return true;
    }
    else {
      return false;
    }
  }
  else {
    return false;
  }
}

app.post("/api/cancel-task", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var task_id = req.body.task_id;
  var dt = req.body.date;

  var sql = "SELECT * FROM recurrent_checks WHERE task_id = ? AND date = ?";
  con.query(sql, [task_id, dt], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
      return;
    }
    if (result.length > 0) {
      if (result[0].is_done == 1) {
        res.json({status: "NOK", error: "Task has already been done."});
      }
      else {
        var sql2 = "UPDATE recurrent_checks SET is_cancelled = 1 WHERE task_id = ? AND date = ?";
        con.query(sql2, [task_id, dt], function (err2, result2) {
          if (err2) {
            console.log(err2);
            res.json({status: "NOK", error: err2.message});
          }
          res.json({status: "OK", data: "Task has been cancelled successfully."});
        });
      }
    }
    else {
      var sql2 = "INSERT INTO recurrent_checks (task_id, date, is_cancelled, is_done) VALUES (?, ?, 1, 0)";
      con.query(sql2, [task_id, dt], function (err2, result2) {
        if (err2) {
          console.log(err2);
          res.json({status: "NOK", error: err2.message});
        }
        res.json({status: "OK", data: "Task has been cancelled successfully."});
      });
    }
  });
});

app.post("/api/delete-task", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var task_id = req.body.task_id;
  var sql = "DELETE FROM tasks WHERE id = ?";
  con.query(sql, [task_id], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
    }
    var sql2 = "DELETE FROM recurrent_checks WHERE task_id = ?";
    con.query(sql2, [task_id], function (err2, result2) {
      if (err2) {
        console.log(err2);
        res.json({status: "NOK", error: err2.message});
      }

      var sql3 = "DELETE FROM events WHERE task_id = ?";
      con.query(sql3, [task_id], function (err3, result3) {
        if (err3) {
          console.log(err3);
          res.json({status: "NOK", error: err3.message});
        }
        res.json({status: "OK", data: "Task has been deleted successfully."});
      });
    });
  });
});

app.post("/api/add-event", (req, res) => {
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

function nextDate(dayIndex) {
  var today = new Date();
  today.setDate(today.getDate() + (dayIndex - 1 - today.getDay() + 7) % 7 + 1);
  today.setHours(23, 59, 59);
  return today;
}

function previousMonday() {
  var d = new Date();
  d.setDate(d.getDate() + 1 - (d.getDay() || 7));
  d.setHours(0, 0, 0);
  return d;
}

app.get("/api/get-events", (req, res) => {
  var sql = "SELECT description AS value, start_date AS start, end_date AS end FROM events";
  con.query(sql, function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err});
    }
    res.json({status: "OK", data: result});
  });
});

app.get("/api/get-schedule", (req, res) => {
  var last_monday = previousMonday();
  var next_sunday = nextDate(7);

  var sql = "SELECT * FROM events WHERE start_date BETWEEN ? AND ? ORDER BY start_date ASC";
  con.query(sql, [last_monday, next_sunday], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err});
    }
    res.json({status: "OK", data: result});
  });
});

app.get("/api/get-random-task", (req, res) => {
  var sql = "SELECT description FROM tasks WHERE is_done = 0 ORDER BY RAND() LIMIT 1";
  con.query(sql, function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err});
    }
    res.json({status: "OK", data: result[0].description});
  });
});

app.post("/api/check-login", (req, res) => {
  var user = req.body.user;
  var pass = req.body.pass;

  var sql = "SELECT * FROM logins WHERE is_valid = 0 AND created_at > (NOW() - INTERVAL 1 HOUR);";

  con.query(sql, function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
      return;
    }
    if (result.length <= 5) {
      if (user == secretConfig.USER && pass == secretConfig.PASS) {
        req.session.isLoggedIn = true;
        var sql2 = "INSERT INTO logins (is_valid) VALUES (1);";
        con.query(sql2);
        res.json({status: "OK", data: "Login successful."});
      }
      else {
        var sql2 = "INSERT INTO logins (is_valid) VALUES (0);";
        con.query(sql2);
        res.json({status: "NOK", error: "Wrong username/password."});
      }
    }
    else {
      res.json({status: "NOK", error: "Too many login attempts."});
    }
  });
});

app.get("/", function(req, res) {
  res.redirect("/home");
});

app.use(express.static(path.resolve(__dirname) + '/frontend/build'));

app.get('/login', (req, res) => {
  res.sendFile(path.resolve(__dirname) + '/frontend/build/index.html');
});

app.get('/home', (req, res) => {
  if(req.session.isLoggedIn) {
    res.sendFile(path.resolve(__dirname) + '/frontend/build/index.html');
  }
  else {
    res.redirect('/login');
  }
});

app.get('/github-tasks', (req, res) => {
  if(req.session.isLoggedIn) {
    res.sendFile(path.resolve(__dirname) + '/frontend/build/index.html');
  }
  else {
    res.redirect('/login');
  }
});

app.get('/motivation', (req, res) => {
  if(req.session.isLoggedIn) {
    res.sendFile(path.resolve(__dirname) + '/frontend/build/index.html');
  }
  else {
    res.redirect('/login');
  }
});

app.get('/calendar', (req, res) => {
  if(req.session.isLoggedIn) {
    res.sendFile(path.resolve(__dirname) + '/frontend/build/index.html');
  }
  else {
    res.redirect('/login');
  }
});

app.get('/schedule', (req, res) => {
  if(req.session.isLoggedIn) {
    res.sendFile(path.resolve(__dirname) + '/frontend/build/index.html');
  }
  else {
    res.redirect('/login');
  }
});

app.get('/random-task', (req, res) => {
  if(req.session.isLoggedIn) {
    res.sendFile(path.resolve(__dirname) + '/frontend/build/index.html');
  }
  else {
    res.redirect('/login');
  }
});

app.get('/folder/:id', (req, res) => {
  if(req.session.isLoggedIn) {
    res.sendFile(path.resolve(__dirname) + '/frontend/build/index.html');
  }
  else {
    res.redirect('/login');
  }
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
