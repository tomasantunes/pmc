var express = require('express');
var github = require('../libs/github');
var router = express.Router();

var octokit = github.getOctokit();

router.get("/api/get-github-tasks", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var text = '';

  const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({per_page: 100});

  for (var i in repos) {
    var repo_name = repos[i].name;
    try {
      const {data: todo } = await octokit.rest.repos.getContent({
        owner: "tomasantunes",
        repo: repo_name,
        path: "TODO.md",
      });
      var response = await axios.get(todo.download_url);
      console.log(response.data);
      var lines = response.data.split('\n');
      text += '<h3>' + repo_name + '</h3><br/><br/>';
      for (var j in lines) {
        text += lines[j] + '<br/>';
      }
      text += '<br/><br/>';
    }
    catch (err) {
      console.log(err.message);
    }
  }

  res.json({status: "OK", data: text});
});

module.exports = router;