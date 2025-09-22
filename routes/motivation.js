
var express = require('express');
var { getMotivationalText } = require('../libs/openai');
var router = express.Router();

router.get("/api/generate-motivational-text", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var motivational_text = await getMotivationalText();
  motivational_text = motivational_text.replace(/(?:\r\n|\r|\n)/g, '<br>');
  res.json({status: "OK", data: motivational_text});
});

module.exports = router;