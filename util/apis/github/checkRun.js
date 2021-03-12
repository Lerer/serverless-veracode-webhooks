'use strict';

// const { Octokit } = require("@octokit/rest");
// const { createAppAuth } = require("@octokit/auth-app");

const githubAPIHandler = require('../../helper/githubAPIHandler');

// const appId = process.env.GITHUB_APP_ID;
// const installationId = process.env.GITHUB_APP_INSTALL_ID;
// const begin = '-----BEGIN RSA PRIVATE KEY-----';
// const end = '-----END RSA PRIVATE KEY-----';

const CHECK_NAME = 'Veracode Upload and Scan';
const CHECK_RESULT_TITLE = `${CHECK_NAME} Results`;
//const TEST_RUN_TITLE = 'Veracode Static Scan Results';

const CONCLUSION = {
    SUCCESS : 'success', 
    FAILURE: 'failure',
    NATURAL:  'neutral', 
    CANCELLED: 'cancelled', 
    SKIPPED: 'skipped', 
    TIME_OUT: 'timed_out', 
    ACTION_REQUIRED: 'action_required'
}

// const getAuthApp = async () => {
//     console.log('getAuthApp - START');
//     var pem = process.env.PEM;

//     const content = pem.substring(begin.length,pem.length-end.length);

//     const parsedPEM = begin + content.replace(/\s+/gi, "\n") + end;
//     //console.log(parsedPEM.length);
  
//     try {
//         const appOctokit = new Octokit({
//             authStrategy: createAppAuth,
//             auth: {
//                 appId,
//                 privateKey: parsedPEM,
//                 installationId,
//             },
//         });

//         //const authRes = 
//         await appOctokit.auth({
//             type: "installation",
//         });
//         console.log('getAuthApp - END');
//         return appOctokit;
//     } catch (e) {
//         console.log('getAuthApp - END ==   ERROR   ===============================');
//         console.log(e);
//     }
//     return;
// }

const createCheckRun = async (owner,repo,headSHA) => {
    console.log('createNewCheckRun - START');
    let check;
    try {
        const appOctokit = await githubAPIHandler.getAuthApp();
        check = await appOctokit.checks.create({
            owner,
            repo,
            name: CHECK_NAME,
            status: 'queued',
            head_sha: headSHA
        });
        //console.log(check);
    } catch (e) {
        console.log('===========   ERROR   ===============================');
        console.log(e);
    }
    console.log('createNewCheckRun - END');
    return check;
}

const updateCheckRun = async (owner,repo,checkRunId,input) => {
    console.log('updateNewCheckRun - START');
    let check;
    try {
        const appOctokit = await githubAPIHandler.getAuthApp();
        check = await appOctokit.checks.update({
            ...input,
            owner,
            repo,
            check_run_id: checkRunId
        });
        //console.log(check);
    } catch (e) {
        console.log('===========   ERROR   ===============================');
        console.log(e);
    }
    console.log('updateNewCheckRun - END');
    return check;
}

// const closeCheckRun = async (appGUID,sandboxGUID, buildId, checkRunId) => {
//     const summary = await buildSummaryHandler.getBuildSummary(appGUID,sandboxGUID,buildId);
//     //console.log(summary);
//     const summaryMD = buildSummaryHandler.getBuildSummaryMarkDown(summary);
//     const textMD = buildSummaryHandler.getBuildSumaryDetails(summary);
//     console.log(textMD);
//     console.log(summaryMD);
//     const updateCheckResponse = await checkRunHandler.updateCheckRun('Lerer','veracode-async',checkRunId,{
//         status: 'completed',
//         // todo - update conclusion
//         conclusion: 'neutral',
//         output: {
//             summary: summaryMD,
//             title: CHECK_RESULT_TITLE,
//             text: textMD
//         }
//     });
//     return updateCheckResponse;
// };

// const listRepoIssue = async () => {
//     console.log('listRepoIssue - START');
   
//     try {
//         const appOctokit = githubAPIHandler.getAuthApp();
    
//         const res = await appOctokit
//         //.request('GET /repos/{owner}/{repo}/issues/{issue_number}', {
//             .issues.listForRepo({
//             owner: 'Lerer',
//             repo: 'veracode-async',
//             //issue_number: 5,
//             //body: 'Issue comment',
//             //title: 'Issue title'
//         });
  
//         console.log(res);
//     } catch (e) {
//         console.log('=======================   ERROR   ===============================');
//         console.log(e);
//     }
//     console.log('listRepoIssue - END');
// };

const baseSQSMessageFromGithubEvent = (eventJson) => {
    if (typeof eventJson === 'string'){
        eventJson = JSON.parse(eventJson);
    }
    let sqsBody = {};
    if (eventJson) {
        sqsBody = {
            repository_full_name: eventJson.repository.full_name,
            repository_id: eventJson.repository.id,
            repository_name: eventJson.repository.name,
            repository_owner_login: eventJson.repository.owner.login,
            repository_url: eventJson.repository.url,
            commit_sha: eventJson.data.commit,
            workflow_run_id: eventJson.data.run_id,
            veracode_app_name: eventJson.data.veracode_app_name,
            veracode_sandbox_name: eventJson.data.veracode_sandbox_name,
            github_event: eventJson.github_event
        }
    }
    return sqsBody;
}

module.exports = {
    //listRepoIssue,
    createCheckRun,
    baseSQSMessageFromGithubEvent,
    updateCheckRun,
    // closeCheckRun,
    CHECK_RESULT_TITLE,
    CONCLUSION
}