var express = require('express');
var path = require('path');
var router = express.Router();

router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

router.get('/home', (req, res) => {
  if(req.session.isLoggedIn) {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  }
  else {
    res.redirect('/login');
  }
});

router.get('/github-tasks', (req, res) => {
  if(req.session.isLoggedIn) {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  }
  else {
    res.redirect('/login');
  }
});

router.get('/motivation', (req, res) => {
  if(req.session.isLoggedIn) {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  }
  else {
    res.redirect('/login');
  }
});

router.get('/calendar', (req, res) => {
  if(req.session.isLoggedIn) {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  }
  else {
    res.redirect('/login');
  }
});

router.get('/schedule', (req, res) => {
  if(req.session.isLoggedIn) {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  }
  else {
    res.redirect('/login');
  }
});

router.get('/random-task', (req, res) => {
  if(req.session.isLoggedIn) {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  }
  else {
    res.redirect('/login');
  }
});

router.get('/folder/:id', (req, res) => {
  if(req.session.isLoggedIn) {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  }
  else {
    res.redirect('/login');
  }
});

module.exports = router;