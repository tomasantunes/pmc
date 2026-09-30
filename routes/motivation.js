
var express = require('express');
var { getMotivationalText } = require('../libs/openai');
var router = express.Router();

router.get("/api/generate-motivational-text", async (req, res) => {
  if (!req.session.isLoggedIn || !req.session.isAdmin) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  try {
    var motivational_text = await getMotivationalText();
    res.json({status: "OK", data: motivational_text});
  } catch (err) {
    console.error("Unable to generate motivational text:", err);
    res.status(500).json({status: "NOK", error: "Unable to generate motivational text."});
  }
});

module.exports = router;
