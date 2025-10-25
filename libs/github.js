const { Octokit } = require("@octokit/rest");
var secretConfig = require('../secret-config');

function getOctokit() {
    const octokit = new Octokit({
        auth: secretConfig.GITHUB_TOKEN,
        userAgent: 'myApp v1.2.3',
        previews: ['jean-grey', 'symmetra'],
        timeZone: 'Europe/Lisbon',
        baseUrl: 'https://api.github.com',
        log: {
            debug: () => {},
            info: () => {},
            warn: console.warn,
            error: console.log
        },
        request: {
            agent: undefined,
            fetch: undefined,
            timeout: 0
        }
    });
    return octokit;
}

function hasGithubToken() {
    return secretConfig.GITHUB_TOKEN && secretConfig.GITHUB_TOKEN.length > 0;
}

module.exports = {
    getOctokit,
    hasGithubToken,
    default: {
        getOctokit,
        hasGithubToken
    }
};