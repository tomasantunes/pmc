var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('mysql2');
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

app.post("/api/add-folder", (req, res) => {
  var name = req.body.name;
  var sql = "INSERT INTO folders (name) VALUES (?)";
  con.query(sql, [name], function (err, result) {
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
