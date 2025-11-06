var express = require('express');
var database = require('../libs/database');
var router = express.Router();

var { con, con2 } = database.getMySQLConnections();

router.post('/api/time-tracker/start', async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  try {
    const { description } = req.body;
    if (!description) return res.status(400).json({ error: 'Missing description' });

    const sql = `INSERT INTO time_tracking_sessions (description, start_time) VALUES (?, NOW())`;
    const result = await con2.query(sql, [description]);

    // create an initial sub-session (running)
    await con2.query(`INSERT INTO time_tracking_sub_sessions (session_id, start_time) VALUES (?, NOW())`, [result[0].insertId]);

    res.json({ status: 'OK', session_id: result[0].insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

router.post('/api/time-tracker/:id/pause', async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  try {
    const { id } = req.params;

    // Close latest sub-session if running
    const sql = `
      UPDATE time_tracking_sub_sessions
      SET end_time = NOW()
      WHERE session_id = ? AND end_time IS NULL
      ORDER BY id DESC LIMIT 1
    `;
    await con2.query(sql, [id]);

    res.json({ status: 'OK', message: 'Session paused' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to pause session' });
  }
});

router.post('/api/time-tracker/:id/resume', async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  try {
    const { id } = req.params;
    await con2.query(`INSERT INTO time_tracking_sub_sessions (session_id, start_time) VALUES (?, NOW())`, [id]);
    res.json({ status: 'OK', message: 'Session resumed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to resume session' });
  }
});

router.post('/api/time-tracker/:id/stop', async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  try {
    const { id } = req.params;

    // Close current running sub-session (if any)
    await con2.query(
      `UPDATE time_tracking_sub_sessions SET end_time = NOW()
       WHERE session_id = ? AND end_time IS NULL
       ORDER BY id DESC LIMIT 1`,
      [id]
    );

    // Set end_time for main session
    await con2.query(`UPDATE time_tracking_sessions SET end_time = NOW() WHERE id = ?`, [id]);

    res.json({ status: 'OK', message: 'Session stopped' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to stop session' });
  }
});

router.get('/api/time-tracker/list', async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  try {
    const sql = `
      SELECT 
        s.id, 
        s.description, 
        s.start_time, 
        s.end_time,
        IFNULL(SUM(TIMESTAMPDIFF(SECOND, sub.start_time, IFNULL(sub.end_time, NOW()))), 0) AS total_seconds
      FROM time_tracking_sessions s
      LEFT JOIN time_tracking_sub_sessions sub ON s.id = sub.session_id
      WHERE s.id IS NOT NULL
      GROUP BY s.id
      ORDER BY s.id DESC
    `;

    const [rows, fields] = await con2.query(sql);

    const sessions = rows
    .filter(r => r.id) // only valid sessions
    .map((r) => ({
      id: r.id,
      description: r.description,
      start_time: r.start_time,
      end_time: r.end_time,
      total_seconds: Number(r.total_seconds) || 0,
      is_running: r.end_time == null,
    }));

    res.json({ status: 'OK', sessions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list sessions' });
  }
});

module.exports = router;