var express = require('express');
var github = require('../libs/github');
var router = express.Router();
var axios = require("axios");

var octokit = github.getOctokit();

router.get("/api/get-github-tasks", async (req, res) => {
  if (!req.session.isLoggedIn) {
    return res.json({ status: "NOK", error: "Invalid Authorization." });
  }

  let result = {};

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
        let lines = response.data.split("\n");

        lines = lines.filter((l) => l.trim().startsWith("-"));

        if (lines.length > 0) {
          if (!result.hasOwnProperty(repo.name)) result[repo.name] = {repo_name: repo.name, repo_url: repo.html_url, tasks: []};
          for (const line of lines) {
            result[repo.name]['tasks'].push({title: line});
          }
        }

        const issues = await octokit.paginate(octokit.issues.listForRepo, {
          owner: repo.owner.login,
          repo: repo.name,
          state: "open",
          per_page: 100,
        });

        if (issues.length > 0) {
          if (!result.hasOwnProperty(repo.name)) result[repo.name] = {repo_name: repo.name, repo_url: repo.html_url, tasks: []};
          for (const issue of issues) {
            result[repo.name]['tasks'].push({title: issue.title, url: issue.html_url});
          }
        }
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

    return res.json({ status: "OK", data: result });
  } catch (err) {
    console.error("Top-level Octokit error:", err);
    return res.status(500).json({
      status: "NOK",
      error: "Failed to fetch repositories.",
    });
  }
});

module.exports = router;