var express = require("express");
var database = require("../libs/database");
var router = express.Router();

var { con } = database.getMySQLConnections();

function requireLogin(req, res) {
  if (!req.session.isLoggedIn) {
    res.json({ status: "NOK", error: "Invalid Authorization." });
    return false;
  }
  return true;
}

router.get("/api/workflows", (req, res) => {
  if (!requireLogin(req, res)) return;

  var sql = "SELECT id, name, created_at, updated_at FROM workflows WHERE user_id = ? ORDER BY updated_at DESC, id DESC";
  con.query(sql, [req.session.userId], function (err, result) {
    if (err) {
      console.log(err);
      res.json({ status: "NOK", error: err.message });
      return;
    }
    res.json({ status: "OK", data: result });
  });
});

router.get("/api/workflows/:id", (req, res) => {
  if (!requireLogin(req, res)) return;

  var sql = "SELECT id, name, workflow_json_base64, created_at, updated_at FROM workflows WHERE id = ? AND user_id = ?";
  con.query(sql, [req.params.id, req.session.userId], function (err, result) {
    if (err) {
      console.log(err);
      res.json({ status: "NOK", error: err.message });
      return;
    }
    if (result.length === 0) {
      res.json({ status: "NOK", error: "Workflow not found." });
      return;
    }
    res.json({ status: "OK", data: result[0] });
  });
});

router.post("/api/workflows", (req, res) => {
  if (!requireLogin(req, res)) return;

  var name = (req.body.name || "").trim();
  var workflowJsonBase64 = req.body.workflow_json_base64 || "";

  if (!name) {
    res.json({ status: "NOK", error: "Workflow name is required." });
    return;
  }

  var sql = "INSERT INTO workflows (user_id, name, workflow_json_base64) VALUES (?, ?, ?)";
  con.query(sql, [req.session.userId, name, workflowJsonBase64], function (err, result) {
    if (err) {
      console.log(err);
      res.json({ status: "NOK", error: err.message });
      return;
    }
    res.json({ status: "OK", data: { insertId: result.insertId } });
  });
});

router.post("/api/workflows/:id", (req, res) => {
  if (!requireLogin(req, res)) return;

  var name = (req.body.name || "").trim();
  var workflowJsonBase64 = req.body.workflow_json_base64 || "";

  if (!name) {
    res.json({ status: "NOK", error: "Workflow name is required." });
    return;
  }

  var sql = "UPDATE workflows SET name = ?, workflow_json_base64 = ? WHERE id = ? AND user_id = ?";
  con.query(sql, [name, workflowJsonBase64, req.params.id, req.session.userId], function (err, result) {
    if (err) {
      console.log(err);
      res.json({ status: "NOK", error: err.message });
      return;
    }
    if (result.affectedRows === 0) {
      res.json({ status: "NOK", error: "Workflow not found." });
      return;
    }
    res.json({ status: "OK", data: "Workflow has been saved successfully." });
  });
});

router.post("/api/workflows/:id/delete", (req, res) => {
  if (!requireLogin(req, res)) return;

  var sql = "DELETE FROM workflows WHERE id = ? AND user_id = ?";
  con.query(sql, [req.params.id, req.session.userId], function (err, result) {
    if (err) {
      console.log(err);
      res.json({ status: "NOK", error: err.message });
      return;
    }
    if (result.affectedRows === 0) {
      res.json({ status: "NOK", error: "Workflow not found." });
      return;
    }
    res.json({ status: "OK", data: "Workflow has been deleted successfully." });
  });
});

module.exports = router;
