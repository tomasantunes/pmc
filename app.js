var createError = require("http-errors");
var fs = require("fs");
var path = require("path");

var envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) process.loadEnvFile(envPath);

var express = require("express");
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
var workflowsRouter = require("./routes/workflows");
var externalRouter = require("./routes/external");

var app = express();
var isProduction = process.env.NODE_ENV === "production";

// Browser protections that do not require a third-party middleware package.
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Content-Security-Policy", "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; media-src 'self' blob:");
  if (isProduction) res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});

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
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));
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
    name: isProduction ? "__Host-pmc.sid" : "pmc.sid",
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 8 * 60 * 60 * 1000,
      path: "/",
    },
  }),
);

// Axios sends this readable double-submit cookie back as X-XSRF-TOKEN.  The
// authentication cookie remains HttpOnly, so a cross-site form cannot satisfy
// this check. Public account-recovery routes do not use a session cookie.
const csrfExemptPaths = new Set([
  "/api/check-login", "/api/sign-up", "/api/reset-password",
  "/api/set-new-password", "/check-login",
]);
app.use((req, res, next) => {
  // Login regenerates the session and writes its own CSRF token. Do not issue
  // a token for the anonymous session first, otherwise one response contains
  // two XSRF-TOKEN cookies with different values.
  if (req.path === "/api/check-login") return next();
  if (!req.session.csrfToken) {
    req.session.csrfToken = require("crypto").randomBytes(32).toString("hex");
  }
  res.cookie("XSRF-TOKEN", req.session.csrfToken, {
    httpOnly: false, secure: isProduction, sameSite: "lax", path: "/",
  });
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method) || csrfExemptPaths.has(req.path)) return next();
  const origin = req.get("origin");
  const expectedOrigin = secretConfig.BASE_URL && new URL(secretConfig.BASE_URL).origin;
  const token = req.get("X-XSRF-TOKEN");
  if (!origin || !expectedOrigin || origin !== expectedOrigin || token !== req.session.csrfToken) {
    return res.status(403).json({ status: "NOK", error: "Invalid request origin." });
  }
  next();
});

cronJobs.loadCron().catch((err) => {
  console.error("Unable to initialize cron email alerts:", err);
});

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
app.use("/", workflowsRouter);
app.use("/", externalRouter);

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
  console.error("Unhandled application error:", err);
  // Never render stack traces or implementation details to clients.
  res.locals.message = "An unexpected error occurred.";
  res.locals.error = {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

process.on('SIGINT', async () => {
  await redisClient.quit();
  process.exit(0);
});

module.exports = app;
