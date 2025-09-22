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
            error: console.error
        },
        request: {
            agent: undefined,
            fetch: undefined,
            timeout: 0
        }
    });
    return octokit;
}

module.exports = {
    getOctokit,
    default: {
        getOctokit
    }
};