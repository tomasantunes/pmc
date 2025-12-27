var express = require('express');
var database = require('../libs/database');
var secretConfig = require('../secret-config');
var crypto = require('crypto');
var bcrypt = require('bcrypt');
var {toLocaleISOString} = require('../libs/utils');
var { sendEmail } = require('../libs/email');
var router = express.Router();

var {con, con2 } = database.getMySQLConnections();
const SALT_ROUNDS = 12;

router.post("/api/check-login", async (req, res) => {
  var user = req.body.user;
  var pass = req.body.pass;
  var user_id = null;

  if (user == secretConfig.USER && pass == secretConfig.PASS) {
    user_id = 0;
  }
  else {
    var sql1 = "SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1";

    var [rows, fields] = await con2.execute(sql1, [user, user]);

    if (rows.length === 0) {
      res.json({status: "NOK", error: "User not found."});
      return;
    }
    user_id = rows[0].id;
  }

  var sql2 = "SELECT * FROM logins WHERE is_valid = 0 AND user_id = ? AND created_at > (NOW() - INTERVAL 1 HOUR);";

  con.query(sql2, [user_id], async function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
      return;
    }
    if (result.length <= 5) {
      if (user_id === 0) {
        req.session.isLoggedIn = true;
        req.session.isAdmin = true;
        req.session.userId = 0;
        var sql2 = "INSERT INTO logins (is_valid, user_id) VALUES (1, ?);";
        con.query(sql2, [user_id]);
        req.session.save(() => {
          res.json({ status: "OK", data: "Login successful." });
        });
      }
      else {
        // check login for regular users here
        const isValid = await bcrypt.compare(pass, rows[0].password_hash);

        if (isValid) {
          var sql2 = "INSERT INTO logins (is_valid, user_id) VALUES (1, ?);";
          con.query(sql2, [user_id]);
          req.session.isLoggedIn = true;
          req.session.isAdmin = false;
          req.session.userId = user_id;
          req.session.save(() => {
            res.json({ status: "OK", data: "Login successful." });
          });
        }
        else {
          var sql2 = "INSERT INTO logins (is_valid, user_id) VALUES (0, ?);";
          con.query(sql2, [user_id]);
          res.json({status: "NOK", error: "Invalid password."});
        }
      }
    }
    else {
      res.json({status: "NOK", error: "Too many login attempts."});
    }
  });
});

router.post("/api/sign-up", async (req, res) => {
  var user = req.body.user;
  var email = req.body.email;
  var pass = req.body.pass;
  var confirmPass = req.body.confirmPass;

  if (pass !== confirmPass) {
    res.json({status: "NOK", error: "Passwords do not match."});
    return;
  }

  const hashedPassword = await bcrypt.hash(pass, SALT_ROUNDS);

  var sql1 = "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?);";

  try {
    await con2.execute(sql1, [user, email, hashedPassword]);
  } catch (err) {
    console.log(err);
    res.json({status: "NOK", error: "Username or email already exists."});
    return;
  }

  res.json({status: "OK", data: "Sign-up successful."});
});

router.post("/api/reset-password", async (req, res) => {
  var emailUsername = req.body.emailUsername;

  if (!emailUsername) {
    res.json({status: "NOK", error: "Email/Username is required."});
    return;
  }

  var sql1 = "SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1";

  var [rows, fields] = await con2.execute(sql1, [emailUsername, emailUsername]);
  if (rows.length === 0) {
    res.json({status: "NOK", error: "User not found."});
    return;
  }

  var resetPasswordToken = crypto.randomBytes(32).toString('hex');
  var resetPasswordExpires = Date.now() + 3600000; // 1 hour
  var user_id = rows[0].id;

  var sql2 = "UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?;";

  try {
    await con2.execute(sql2, [resetPasswordToken, toLocaleISOString(new Date(resetPasswordExpires)), user_id]);
    var resetLink = `${secretConfig.BASE_URL}/set-new-password?token=${resetPasswordToken}&id=${user_id}`;
    var emailText = `Click the following link to reset your password: <a href="${resetLink}">${resetLink}</a>`;
    sendEmail(emailText);
  } catch (err) {
    console.log(err);
    res.json({status: "NOK", error: "Error setting reset token."});
    return;
  }

  res.json({status: "OK", data: "Password reset initiated."});
});

router.get("/api/logout", (req, res) => {
  req.session.isLoggedIn = false;
  req.session.isAdmin = false;
  req.session.userId = null;
  req.session.save(() => {
    res.redirect("/");
  });
});

router.get("/debug-session", (req, res) => {
  res.json({
    sessionId: req.sessionID,
    session: req.session
  });
});

router.post("/api/set-new-password", async (req, res) => {
  var resetPasswordToken = req.body.resetPasswordToken;
  var resetPasswordUserId = req.body.resetPasswordUserId;
  var pass = req.body.pass;
  var confirmPass = req.body.confirmPass;

  if (pass !== confirmPass) {
    res.json({status: "NOK", error: "Passwords do not match."});
    return;
  }

  var sql1 = "SELECT * FROM users WHERE id = ? AND reset_password_token = ? AND reset_password_expires > NOW() LIMIT 1";

  var [rows, fields] = await con2.execute(sql1, [resetPasswordUserId, resetPasswordToken]);
  if (rows.length === 0) {
    res.json({status: "NOK", error: "Invalid or expired reset token."});
    return;
  }

  const hashedPassword = await bcrypt.hash(pass, SALT_ROUNDS);

  var sql2 = "UPDATE users SET password_hash = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?;";
  try {
    await con2.execute(sql2, [hashedPassword, resetPasswordUserId]);
  } catch (err) {
    console.log(err);
    res.json({status: "NOK", error: "Error updating password."});
    return;
  }
  res.json({status: "OK", data: "Password updated successfully."});
});

router.post("/check-login", (req, res) => {
  if (req.session.isLoggedIn) {
    res.json({status: "OK"});
  }
  else {
    res.json({status: "NOK"});
  }
});

module.exports = router;