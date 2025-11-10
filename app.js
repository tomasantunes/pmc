var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var secretConfig = require("./secret-config");
var session = require("express-session");
var cronJobs = require("./libs/cronjobs");

var authRouter = require("./routes/auth");
var dashboardRouter = require("./routes/dashboard");
var foldersRouter = require("./routes/folders");
var motivationRouter = require("./routes/motivation");
var tasksRouter = require("./routes/tasks");
var recurrentTasksRouter = require("./routes/recurrent-tasks");
var githubRouter = require("./routes/github");
var calendarRouter = require("./routes/calendar");
var scheduleRouter = require("./routes/schedule");
var dailyTodosRouter = require("./routes/daily-todos");
var monthlyTasksRouter = require("./routes/monthly-tasks");
var timetrackerRouter = require("./routes/timetracker");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: secretConfig.SESSION_KEY,
    resave: false,
    saveUninitialized: true,
  }),
);

cronJobs.loadCron();

app.use(express.static(path.resolve(__dirname) + "/frontend/dist"));
app.use("/", authRouter);
app.use("/", dashboardRouter);
app.use("/", foldersRouter);
app.use("/", motivationRouter);
app.use("/", tasksRouter);
app.use("/", recurrentTasksRouter);
app.use("/", githubRouter);
app.use("/", calendarRouter);
app.use("/", scheduleRouter);
app.use("/", dailyTodosRouter);
app.use("/", monthlyTasksRouter);
app.use("/", timetrackerRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
