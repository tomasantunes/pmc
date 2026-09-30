var express = require("express");

var router = express.Router();

router.get("/external/get-data", async (req, res) => {
  // A single shared key cannot safely authorize a whole-database export.
  // This legacy endpoint is deliberately retired; create a new, scoped export
  // service with per-integration credentials before enabling any replacement.
  return res.status(404).json({ status: "NOK", error: "Not found." });
});

module.exports = router;
