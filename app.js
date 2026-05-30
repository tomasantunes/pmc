var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var secretConfig = require("./secret-config");
var session = require("express-session");
var cronJobs = require("./libs/cronjobs");
const { RedisStore } = require("connect-redis");
const { createClient } = require('redis');

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
var alertsRouter = require("./routes/alerts");
var staticFilesRouter = require("./routes/static-files");
var voiceOverviewRouter = require("./routes/voice-overview");

var app = express();

const redisClient = createClient({
  url: secretConfig.REDIS_URL,
  password: secretConfig.REDIS_PASSWORD
});

redisClient.connect().catch(console.error);

redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.set("trust proxy", 1);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());


app.use(
  session({
    store: new RedisStore({ 
      client: redisClient,
      prefix: 'pmc:sess:', // Optional: prefix for session keys in Redis
    }),
    secret: secretConfig.SESSION_KEY,
    resave: false,
    saveUninitialized: false,
  }),
);

cronJobs.loadCron();

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
app.use("/", alertsRouter);
app.use("/", voiceOverviewRouter);

app.use("/static", staticFilesRouter);
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.resolve(__dirname) + "/frontend/dist", {
  index: false
}));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
/* eslint-disable no-unused-vars */
app.use(function (err, req, res, next) {
/* eslint-enable no-unused-vars */
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

process.on('SIGINT', async () => {
  await redisClient.quit();
  process.exit(0);
});

module.exports = app;
