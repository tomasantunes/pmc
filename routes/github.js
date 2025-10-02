var express = require('express');
var github = require('../libs/github');
var router = express.Router();
var axios = require("axios");

var octokit = github.getOctokit();

router.get("/api/get-github-tasks", async (req, res) => {
  if (!req.session.isLoggedIn) {
    return res.json({ status: "NOK", error: "Invalid Authorization." });
  }

  let text = "";

  try {
    const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
      per_page: 100,
    });

    for (const repo of repos) {
      try {
        const { data: todo } = await octokit.rest.repos.getContent({
          owner: "tomasantunes",
          repo: repo.name,
          path: "TODO.md",
        });

        // fetch TODO.md text content
        const response = await axios.get(todo.download_url);
        const lines = response.data.split("\n");

        text += `<h3>${repo.name}</h3><br/><br/>`;
        for (const line of lines) {
          text += line + "<br/>";
        }
        text += "<br/><br/>";
      } catch (err) {
        if (err.status === 404) {
          // Gracefully ignore missing TODO.md
          console.log(`Repo ${repo.name} has no TODO.md`);
        } else {
          console.error(`Unexpected error on repo ${repo.name}:`, err);
          return res.status(500).json({
            status: "NOK",
            error: "Unexpected error while fetching GitHub tasks.",
          });
        }
      }
    }

    return res.json({ status: "OK", data: text });
  } catch (err) {
    console.error("Top-level Octokit error:", err);
    return res.status(500).json({
      status: "NOK",
      error: "Failed to fetch repositories.",
    });
  }
});

module.exports = router;