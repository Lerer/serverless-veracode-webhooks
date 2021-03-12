const githubAPIHandler = require('../../helper/githubAPIHandler');

const listRepoIssue = async (owner,repo) => {
    console.log('listRepoIssue - START');
   
    try {
        const appOctokit = await githubAPIHandler.getAuthApp();
        const res = await appOctokit
            .issues.listForRepo({
            owner,
            repo,
           
        });
  
        console.log(res);
    } catch (e) {
        console.log('=======================   ERROR   ===============================');
        console.log(e);
    }
    console.log('listRepoIssue - END');
};


module.exports = {
    listRepoIssue,
}
