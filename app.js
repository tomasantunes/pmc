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
var axios = require('axios');

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
    timezone: '+00:00',
    port: 3306
  });

  con2 = mysql2.createPool({
    connectionLimit : 90,
    connectTimeout: 1000000,
    host: secretConfig.DB_HOST,
    user: secretConfig.DB_USER,
    password: secretConfig.DB_PASSWORD,
    database: secretConfig.DB_NAME,
    timezone: '+00:00',
    port: 3306
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
    timezone: '+00:00'
  });

  con2 = mysql2.createPool({
    connectionLimit : 90,
    connectTimeout: 1000000,
    host: secretConfig.DB_HOST,
    user: secretConfig.DB_USER,
    password: secretConfig.DB_PASSWORD,
    database: secretConfig.DB_NAME,
    socketPath: '/var/run/mysqld/mysqld.sock',
    timezone: '+00:00'
  });
}

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
  var sql = "SELECT * FROM tasks WHERE folder_id = ? ORDER BY sort_index ASC";
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
    res.json({status: "OK", data: "Folder has been deleted successfully."});
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

app.post("/api/set-hide-not-this-week", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var folder_id = req.body.folder_id;
  var hide_not_this_week = req.body.hide_not_this_week;
  var sql = "UPDATE folders SET hide_not_this_week = ? WHERE id = ?";
  con.query(sql, [hide_not_this_week, folder_id], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
    }
    res.json({status: "OK", data: "Folder has been updated successfully."});
  });
});

app.get("/api/get-recurrent-tasks", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var folder_id = req.query.folder_id;
  var dti = req.query.dti;
  var dtf = req.query.dtf;
  var sql = "SELECT * FROM tasks WHERE folder_id = ? ORDER BY sort_index ASC";
  con.query(sql, [folder_id], async function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
    }

    for (var i in result) {
      var task_id = result[i].id;
      var checks = await getTaskChecks(task_id, dti, dtf);
      result[i].checks = checks;
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
  var time = req.body.time;
  var task_type = req.body.task_type;
  var week_day = req.body.week_day;
  var month_day = req.body.month_day;
  var month = req.body.month;
  var sort_index = req.body.sort_index;

  if (task_type == "week_day") {
    var sql = "INSERT INTO tasks (folder_id, description, time, type, week_day, sort_index, is_done) VALUES (?, ?, ?, ?, ?, ?, 0)";
    con.query(sql, [folder_id, description, time, task_type, week_day, sort_index], function (err, result) {
      if (err) {
        console.log(err);
        res.json({status: "NOK", error: err.message});
      }
      res.json({status: "OK", data: "Task has been added successfully."});
    });
  }
  else if (task_type == "month_day") {
    var sql = "INSERT INTO tasks (folder_id, description, time, type, month_day, sort_index, is_done) VALUES (?, ?, ?, ?, ?, ?, 0)";
    con.query(sql, [folder_id, description, time, task_type, month_day, sort_index], function (err, result) {
      if (err) {
        console.log(err);
        res.json({status: "NOK", error: err.message});
      }
      res.json({status: "OK", data: "Task has been added successfully."});
    });
  }
  else if (task_type == "year_day") {
    var sql = "INSERT INTO tasks (folder_id, description, time, type, month_day, month, sort_index, is_done) VALUES (?, ?, ?, ?, ?, ?, ?, 0)";
    con.query(sql, [folder_id, description, time, task_type, month_day, month, sort_index], function (err, result) {
      if (err) {
        console.log(err);
        res.json({status: "NOK", error: err.message});
      }
      res.json({status: "OK", data: "Task has been added successfully."});
    });
  }
  else {
    var sql = "INSERT INTO tasks (folder_id, description, time, type, sort_index, is_done) VALUES (?, ?, ?, ?, ?, 0)";
    con.query(sql, [folder_id, description, time, task_type, sort_index], function (err, result) {
      if (err) {
        console.log(err);
        res.json({status: "NOK", error: err.message});
      }
      res.json({status: "OK", data: "Task has been added successfully."});
    });
  }
});

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
        var today_tasks = getTodayTasks(result3);
        if (today_tasks.length > 0) {
          var sql4 = "SELECT * FROM recurrent_checks WHERE task_id IN (?) AND is_done = 1 AND date = DATE(NOW())";
          con.query(sql4, [today_tasks], function (err4, result4) {
            if (err4) {
              console.log(err4);
              res.json({status: "NOK", error: err4.message});
            }
            var today_tasks_done = result4.length || 0;
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
      text += repo_name + '<br><br>';
      for (var j in lines) {
        text += lines[j] + '<br><br>';
      }
    }
    catch (err) {
      console.log(err.message);
    }
  }

  res.json({status: "OK", data: text});
});

function getTodayTasks(tasks, cb) {
  var today_tasks = [];
  for (var i in tasks) {
    if (checkIfTaskIsToday(tasks[i])) {
      today_tasks.push(tasks[i].id);
    }
  }
  return today_tasks;
}

function checkIfTaskIsToday(task) {
  var today = new Date();
  var dd = today.getDate();
  var wd = today.getDay() - 1;
  var mm = today.getMonth() + 1;

  if (task.type == "daily") {
    return true;
  }
  else if (task.type == "weekly") {
    if (task.week_day == 5) {
      return true;
    }
  }
  else if (task.type == "monthly") {
    if (task.month_day == dd) {
      return true;
    }
  }
  else if (task.type == "yearly") {
    if (task.month_day == dd && task.month == mm) {
      return true;
    }
  }
  else if(task.type == "week_day") {
    if (task.week_day == wd) {
      return true;
    }
  }
  else if (task.type == "month_day") {
    if (task.month_day == dd) {
      return true;
    }
  }
  else if (task.type == "year_day") {
    if (task.month_day == dd && task.month == mm) {
      return true;
    }
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
  var time = req.body.time;
  var sort_index = req.body.sort_index;
  var sql = "INSERT INTO tasks (folder_id, description, time, is_done, sort_index) VALUES (?, ?, ?, 0, ?)";
  con.query(sql, [folder_id, description, time, sort_index], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
    }
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
  var time = req.body.time;
  var sql = "UPDATE tasks SET description = ?, time = ? WHERE id = ?";
  con.query(sql, [description, time, task_id], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
    }
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
  var time = req.body.time;
  var task_type = req.body.task_type;
  var week_day = req.body.week_day;
  var month_day = req.body.month_day;
  var month = req.body.month;
  var sql = "UPDATE tasks SET description = ?, time = ?, type = ?, week_day = ?, month_day = ?, month = ? WHERE id = ?";
  con.query(sql, [description, time, task_type, week_day, month_day, month, task_id], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
    }
    res.json({status: "OK", data: "Task has been updated successfully."});
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
    res.json({status: "OK", data: "Task has been deleted successfully."});
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
