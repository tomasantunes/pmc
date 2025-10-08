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
    const repos = await octokit.paginate(octokit.repos.listForAuthenticatedUser, {
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

router.get("/api/get-github-issues", async (req, res) => {
  if (!req.session.isLoggedIn) {
    return res.json({ status: "NOK", error: "Invalid Authorization." });
  }

  let text = "";

  try {
    // 1. Get all your repos (including private ones if token allows)
    const repos = await octokit.paginate(octokit.repos.listForAuthenticatedUser, {
      per_page: 100,
    });

    for (const repo of repos) {
      // 2. Get open issues for each repo
      const issues = await octokit.paginate(octokit.issues.listForRepo, {
        owner: repo.owner.login,
        repo: repo.name,
        state: "open",
        per_page: 100,
      });

      if (issues.length > 0) {
        text += `<h3>${repo.name}</h3><br/><br/>`;
        for (const issue of issues) {
          text += issue.title + "<br/>";
        }
        text += "<br/><br/>";
      }
    }
    return res.json({ status: "OK", data: text });
  } catch (error) {
    console.error("Top-level Octokit error:", error);
    return res.status(500).json({
      status: "NOK",
      error: "Failed to fetch repositories.",
    });
  }
});

module.exports = router;