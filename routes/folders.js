var express = require('express');
var database = require('../libs/database');
var router = express.Router();

var {con, con2 } = database.getMySQLConnections();

router.get("/api/get-folders", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var sql = "SELECT * FROM folders WHERE user_id = ?";
  con.query(sql, [req.session.userId], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
    }
    res.json({status: "OK", data: result});
  });
});

router.get("/api/get-folder", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var folder_id = req.query.folder_id;
  var sql = "SELECT * FROM folders WHERE id = ? AND user_id = ?";
  con.query(sql, [folder_id, req.session.userId], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
    }
    res.json({status: "OK", data: result[0]});
  });
});

router.post("/api/edit-folder-name", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var folder_id = req.body.folder_id;
  var name = req.body.name;
  var sql = "UPDATE folders SET name = ? WHERE id = ? AND user_id = ?";
  con.query(sql, [name, folder_id, req.session.userId], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
      return;
    }
    res.json({status: "OK", data: "Folder name has been updated successfully."});
  });
});

router.post("/api/delete-folder", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var folder_id = req.body.folder_id;
  var sql = "DELETE FROM folders WHERE id = ? AND user_id = ?";
  con.query(sql, [folder_id, req.session.userId], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
    }
    var sql2 = "DELETE FROM tasks WHERE folder_id = ? AND user_id = ?";
    con.query(sql2, [folder_id, req.session.userId], function (err2, result2) {
      if (err2) {
        console.log(err2);
        res.json({status: "NOK", error: err2.message});
      }
      var sql3 = "DELETE FROM recurrent_checks WHERE task_id IN (SELECT id FROM tasks WHERE folder_id = ? AND user_id = ?)";
      con.query(sql3, [folder_id, req.session.userId], function (err3, result3) {
        if (err3) {
          console.log(err3);
          res.json({status: "NOK", error: err3.message});
        }

        var sql4 = "DELETE FROM events WHERE task_id IN (SELECT id FROM tasks WHERE folder_id = ? AND user_id = ?)";
        con.query(sql4, [folder_id, req.session.userId], function (err4, result4) {
          if (err4) {
            console.log(err4);
            res.json({status: "NOK", error: err4.message});
          }

          var sql5 = "DELETE FROM alerts WHERE task_id IN (SELECT id FROM tasks WHERE folder_id = ? AND user_id = ?)";
          con.query(sql5, [folder_id, req.session.userId], function (err5, result5) {
            if (err5) {
              console.log(err5);
              res.json({status: "NOK", error: err5.message});
            }
            res.json({status: "OK", data: "Folder has been deleted successfully."});
          });
        });
      });
    });
  });
});

router.post("/api/set-hide-done", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var folder_id = req.body.folder_id;
  var hide_done = req.body.hide_done;
  var sql = "UPDATE folders SET hide_done = ? WHERE id = ? AND user_id = ?";
  con.query(sql, [hide_done, folder_id, req.session.userId], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
      return;
    }
    res.json({status: "OK", data: "Folder has been updated successfully."});
  });
});

router.post("/api/add-folder", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var name = req.body.name;
  var type = req.body.type;
  var sql = "INSERT INTO folders (name, type, user_id) VALUES (?, ?, ?)";
  con.query(sql, [name, type, req.session.userId], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
    }
    res.json({status: "OK", data: {message: "Folder has been added successfully.", insertId: result.insertId}});
  });
});

router.get("/api/list-simple-folders", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var sql = "SELECT id, name FROM folders WHERE type = 'simple' AND user_id = ?";
  con.query(sql, [req.session.userId], function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
      return;
    }

    res.json({status: "OK", data: result});
  });
});

module.exports = router;