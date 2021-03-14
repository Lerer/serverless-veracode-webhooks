const githubAPIHandler = require('../../helper/githubAPIHandler');

const listRepoIssue = async (owner,repo,options) => {
    console.log('listRepoIssue - START');
    let issues = [];
    try {
        const appOctokit = await githubAPIHandler.getAuthApp();
        issues = await appOctokit
            .issues.listForRepo({
                owner,
                repo,
                ...options
        });
  
    } catch (e) {
        console.log('=======================   ERROR   ===============================');
        console.log(e);
    }
    console.log('listRepoIssue - END');
    return issues;
};

const createIssue = async (owner,repo,issueDetails) => {
    console.log('createIssue - START');
    let issue;
    try {
        const appOctokit = await githubAPIHandler.getAuthApp();
        issue = await appOctokit
            .issues.create({
                owner,
                repo,
                title: issueDetails.title,
                body: issueDetails.description,
                labels: issueDetails.labels
        });
  
    } catch (e) {
        console.log('=======================   ERROR   ===============================');
        console.log(e);
    }
    console.log('createIssue - END');
    return issue;
}

const searchRepoIssue = async (query) => {
    console.log('listRepoIssue - START');
   
    try {
        const appOctokit = await githubAPIHandler.getAuthApp();
        const res = await appOctokit
            .search.issuesAndPullRequests({q:query});
  
        console.log(res);
    } catch (e) {
        console.log('=======================   ERROR   ===============================');
        console.log(e);
    }
    console.log('listRepoIssue - END');
};


module.exports = {
    listRepoIssue,
    createIssue,
    searchRepoIssue
}
