var express = require("express");
var database = require("../libs/database");
var router = express.Router();

var { con, con2 } = database.getMySQLConnections();

router.post("/api/time-tracker/start", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({ status: "NOK", error: "Invalid Authorization." });
    return;
  }
  try {
    const { description } = req.body;
    if (!description)
      return res.status(400).json({ error: "Missing description" });

    const sql = `INSERT INTO time_tracking_sessions (description, start_time, user_id) VALUES (?, NOW(), ?)`;
    const result = await con2.query(sql, [description, req.session.userId]);

    // create an initial sub-session (running)
    await con2.query(
      `INSERT INTO time_tracking_sub_sessions (session_id, start_time, user_id) VALUES (?, NOW(), ?)`,
      [result[0].insertId, req.session.userId],
    );

    res.json({ status: "OK", session_id: result[0].insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to start session" });
  }
});

router.post("/api/time-tracker/:id/pause", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({ status: "NOK", error: "Invalid Authorization." });
    return;
  }
  try {
    const { id } = req.params;

    // Close latest open sub-session if exists
    const updateSql = `
      UPDATE time_tracking_sub_sessions
      SET end_time = NOW()
      WHERE session_id = ? AND end_time IS NULL AND user_id = ?
      ORDER BY id DESC
      LIMIT 1
    `;
    const result = await con2.query(updateSql, [id, req.session.userId]);
    // result.affectedRows may be 0 -> nothing to pause
    if (result[0].affectedRows === 0) {
      return res.json({
        status: "OK",
        message: "No running sub-session to pause",
      });
    }

    res.json({ status: "OK", message: "Session paused" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to pause session" });
  }
});

router.post("/api/time-tracker/:id/resume", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({ status: "NOK", error: "Invalid Authorization." });
    return;
  }
  try {
    const { id } = req.params;

    // Check if an open sub-session already exists
    const checkSql = `SELECT 1 FROM time_tracking_sub_sessions WHERE session_id = ? AND end_time IS NULL AND user_id = ? LIMIT 1`;
    const exists = await con2.query(checkSql, [id, req.session.userId]);

    if (exists[0].length > 0) {
      return res.json({ status: "OK", message: "Session already running" });
    }

    await con2.query(
      `INSERT INTO time_tracking_sub_sessions (session_id, start_time, user_id) VALUES (?, NOW(), ?)`,
      [id, req.session.userId],
    );
    res.json({ status: "OK", message: "Session resumed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to resume session" });
  }
});

router.post("/api/time-tracker/:id/stop", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({ status: "NOK", error: "Invalid Authorization." });
    return;
  }
  try {
    const { id } = req.params;

    // Close any open sub-sessions for this session
    await con2.query(
      `UPDATE time_tracking_sub_sessions
       SET end_time = NOW()
       WHERE session_id = ? AND end_time IS NULL AND user_id = ?`,
      [id, req.session.userId],
    );

    // Set end_time for main session
    await con2.query(
      `UPDATE time_tracking_sessions SET end_time = NOW() WHERE id = ? AND user_id = ?`,
      [id, req.session.userId],
    );

    res.json({ status: "OK", message: "Session stopped" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to stop session" });
  }
});

router.post("/api/time-tracker/:id/delete", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({ status: "NOK", error: "Invalid Authorization." });
    return;
  }

  const { id } = req.params;

  let sql1 = "DELETE FROM time_tracking_sessions WHERE id = ? AND user_id = ?";
  await con2.query(sql1, [id, req.session.userId]);

  let sql2 = "DELETE FROM time_tracking_sub_sessions WHERE session_id = ? AND user_id = ?";
  await con2.query(sql2, [id, req.session.userId]);
  res.json({ status: "OK", data: "Session has been deleted." });
});

router.get("/api/time-tracker/list", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({ status: "NOK", error: "Invalid Authorization." });
    return;
  }
  try {
    const sql = `
      SELECT
        s.id,
        s.description,
        s.start_time,
        s.end_time,
        IFNULL(SUM(TIMESTAMPDIFF(SECOND, sub.start_time, IFNULL(sub.end_time, NOW()))), 0) AS total_seconds,
        MAX(sub.end_time IS NULL) AS has_open_sub -- 1 if there's at least one open sub-session
      FROM time_tracking_sessions s
      LEFT JOIN time_tracking_sub_sessions sub ON s.id = sub.session_id
      WHERE s.id IS NOT NULL
      AND s.end_time IS NULL
      AND s.user_id = ?
      GROUP BY s.id
      ORDER BY s.id DESC
    `;
    const [rows, fields] = await con2.query(sql, [req.session.userId]);
    const sessions = rows
      .filter((r) => r.id) // defensive
      .map((r) => ({
        id: r.id,
        description: r.description,
        start_time: r.start_time,
        end_time: r.end_time,
        total_seconds: Number(r.total_seconds) || 0,
        is_running: Boolean(Number(r.has_open_sub)), // convert 0/1 -> true/false
      }));

    res.json({ status: "OK", sessions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to list sessions" });
  }
});

router.get("/api/time-tracker/list-closed", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({ status: "NOK", error: "Invalid Authorization." });
    return;
  }
  try {
    const sql = `
      SELECT
        s.id,
        s.description,
        s.start_time,
        s.end_time,
        IFNULL(SUM(TIMESTAMPDIFF(SECOND, sub.start_time, IFNULL(sub.end_time, NOW()))), 0) AS total_seconds,
        MAX(sub.end_time IS NULL) AS has_open_sub -- 1 if there's at least one open sub-session
      FROM time_tracking_sessions s
      LEFT JOIN time_tracking_sub_sessions sub ON s.id = sub.session_id
      WHERE s.id IS NOT NULL
      AND s.end_time IS NOT NULL
      AND s.user_id = ?
      GROUP BY s.id
      ORDER BY s.id DESC
    `;
    const [rows, fields] = await con2.query(sql, [req.session.userId]);
    const sessions = rows
      .filter((r) => r.id) // defensive
      .map((r) => ({
        id: r.id,
        description: r.description,
        start_time: r.start_time,
        end_time: r.end_time,
        total_seconds: Number(r.total_seconds) || 0,
        is_running: Boolean(Number(r.has_open_sub)), // convert 0/1 -> true/false
      }));

    res.json({ status: "OK", sessions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to list sessions" });
  }
});

router.get("/api/time-tracker/get-autocomplete", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({ status: "NOK", error: "Invalid Authorization." });
    return;
  }

  var sql = "SELECT DISTINCT description FROM time_tracking_sessions WHERE user_id = ?";

  con.query(sql, [req.session.userId], function (err, result) {
    if (err) {
      console.log(err);
      return res.status(500).json({ status: "NOK", error: "Database error." });
    }

    res.json({ status: "OK", data: result });
  });
});

router.get("/api/time-tracker/get-total-time", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({ status: "NOK", error: "Invalid Authorization." });
    return;
  }

  let sql = `
    SELECT
        SEC_TO_TIME(
            SUM(
                TIMESTAMPDIFF(SECOND, start_time, end_time)
            )
        ) AS total_time,
        SUM(
            TIMESTAMPDIFF(SECOND, start_time, end_time)
        ) / 3600 AS total_hours
    FROM time_tracking_sub_sessions
    WHERE start_time IS NOT NULL
      AND end_time IS NOT NULL
      AND user_id = ?
  `;

  con.query(sql, [req.session.userId], function (err, result) {
    if (err) {
      console.log(err);
      return res.status(500).json({ status: "NOK", error: "Database error." });
    }

    res.json({ status: "OK", data: result[0] });
  });
});

module.exports = router;
