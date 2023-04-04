var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('mysql2');
var mysql2 = require('mysql2/promise');
var secretConfig = require('./secret-config');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var con = mysql.createPool({
  connectionLimit : 90,
  connectTimeout: 1000000,
  host: secretConfig.DB_HOST,
  user: secretConfig.DB_USER,
  password: secretConfig.DB_PASSWORD,
  database: secretConfig.DB_NAME,
  timezone: '+00:00'
});

var con2 = mysql2.createPool({
  connectionLimit : 90,
  connectTimeout: 1000000,
  host: secretConfig.DB_HOST,
  user: secretConfig.DB_USER,
  password: secretConfig.DB_PASSWORD,
  database: secretConfig.DB_NAME,
  timezone: '+00:00'
});

app.get("/api/get-folders", (req, res) => {
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

app.get("/api/get-recurrent-tasks", (req, res) => {
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
  var folder_id = req.body.folder_id;
  var description = req.body.description;
  var task_type = req.body.task_type;
  var week_day = req.body.week_day;
  var month_day = req.body.month_day;
  var month = req.body.month;

  console.log(task_type);

  if (task_type == "week_day") {
    var sql = "INSERT INTO tasks (folder_id, description, type, week_day) VALUES (?, ?, ?, ?)";
    con.query(sql, [folder_id, description, task_type, week_day], function (err, result) {
      if (err) {
        console.log(err);
        res.json({status: "NOK", error: err.message});
      }
      res.json({status: "OK", data: "Task has been added successfully."});
    });
  }
  else if (task_type == "month_day") {
    var sql = "INSERT INTO tasks (folder_id, description, type, month_day) VALUES (?, ?, ?, ?)";
    con.query(sql, [folder_id, description, task_type, month_day], function (err, result) {
      if (err) {
        console.log(err);
        res.json({status: "NOK", error: err.message});
      }
      res.json({status: "OK", data: "Task has been added successfully."});
    });
  }
  else if (task_type == "year_day") {
    var sql = "INSERT INTO tasks (folder_id, description, type, month_day, month) VALUES (?, ?, ?, ?, ?)";
    con.query(sql, [folder_id, description, task_type, month_day, month], function (err, result) {
      if (err) {
        console.log(err);
        res.json({status: "NOK", error: err.message});
      }
      res.json({status: "OK", data: "Task has been added successfully."});
    });
  }
  else {
    var sql = "INSERT INTO tasks (folder_id, description, type) VALUES (?, ?, ?)";
    con.query(sql, [folder_id, description, task_type], function (err, result) {
      if (err) {
        console.log(err);
        res.json({status: "NOK", error: err.message});
      }
      res.json({status: "OK", data: "Task has been added successfully."});
    });
  }
});

async function getTaskChecks(task_id, dti, dtf) {
  console.log(dti);
  console.log(dtf);
  var sql = "SELECT * FROM recurrent_checks WHERE task_id = ? AND date BETWEEN ? AND ?";
  const [rows, fields] = await con2.execute(sql, [task_id, dti, dtf]);
  console.log(rows);
  return rows;
}

app.post("/api/add-folder", (req, res) => {
  var name = req.body.name;
  var type = req.body.type;
  var sql = "INSERT INTO folders (name, type) VALUES (?, ?)";
  con.query(sql, [name, type], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
    }
    res.json({status: "OK", data: "Folder has been added successfully."});
  });
});

app.post("/api/update-task-done", (req, res) => {
  var task_id = req.body.task_id;
  var is_done = req.body.is_done;
  var sql = "UPDATE tasks SET is_done = ? WHERE id = ?";
  con.query(sql, [is_done, task_id], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
    }
    res.json({status: "OK", data: "Task has been updated successfully."});
  });
});

app.post("/api/update-recurrent-task-done", (req, res) => {
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
  var folder_id = req.body.folder_id;
  var description = req.body.description;
  var sort_index = req.body.sort_index;
  var sql = "INSERT INTO tasks (folder_id, description, is_done, sort_index) VALUES (?, ?, 0, ?)";
  con.query(sql, [folder_id, description, sort_index], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
    }
    res.json({status: "OK", data: "Task has been added successfully."});
  });
});

app.post("/api/handle-sort", (req, res) => {
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
  var task_id = req.body.task_id;
  var description = req.body.description;
  var sql = "UPDATE tasks SET description = ? WHERE id = ?";
  con.query(sql, [description, task_id], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
    }
    res.json({status: "OK", data: "Task has been updated successfully."});
  });
});

app.post("/api/delete-task", (req, res) => {
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

app.get("/", function(req, res) {
  res.redirect("/home");
});

app.use(express.static(path.resolve(__dirname) + '/frontend/build'));

app.get('/home', (req, res) => {
  res.sendFile(path.resolve(__dirname) + '/frontend/build/index.html');
});

app.get('/folder/:id', (req, res) => {
  res.sendFile(path.resolve(__dirname) + '/frontend/build/index.html');
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
