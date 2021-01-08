'use strict';

const { Octokit } = require("@octokit/rest");
const { createAppAuth } = require("@octokit/auth-app");

const appId = process.env.GITHUB_APP_ID;
const installationId = process.env.GITHUB_APP_INSTALL_ID;
const begin = '-----BEGIN RSA PRIVATE KEY-----';
const end = '-----END RSA PRIVATE KEY-----';

const getAuthApp = async () => {
    console.log('getAuthApp - START');
    var pem = process.env.PEM;

    const content = pem.substring(begin.length,pem.length-end.length);

    const parsedPEM = begin + content.replace(/\s+/gi, "\n") + end;
    //console.log(parsedPEM.length);
  
    try {
        const appOctokit = new Octokit({
            authStrategy: createAppAuth,
            auth: {
                appId,
                privateKey: parsedPEM,
                installationId,
            },
        });

        //const authRes = 
        await appOctokit.auth({
            type: "installation",
        });
        console.log('getAuthApp - END');
        return appOctokit;
    } catch (e) {
        console.log('getAuthApp - END ==   ERROR   ===============================');
        console.log(e);
    }
    return;
}

const createNewCheckRun = async (owner,repo,headSHA) => {
    console.log('createNewCheckRun - START');
    let check;
    try {
        const appOctokit = await getAuthApp();
        check = await appOctokit.checks.create({
            owner,
            repo,
            name: 'Veracode full Static Scan',
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

const updateNewCheckRun = async (owner,repo,checkRunId,input) => {
    console.log('createNewCheckRun - START');
    let check;
    try {
        const appOctokit = await getAuthApp();
        check = await appOctokit.checks.create({
            ...input,
            owner,
            repo,
            check_run_id: checkRunId
        });
        console.log(check);
    } catch (e) {
        console.log('===========   ERROR   ===============================');
        console.log(e);
    }
    console.log('createNewCheckRun - END');
    return check;
}

const listRepoIssue = async () => {
    console.log('listRepoIssue - START');
   
    try {
        const appOctokit = getAuthApp();
    
        const res = await appOctokit
        //.request('GET /repos/{owner}/{repo}/issues/{issue_number}', {
            .issues.listForRepo({
            owner: 'Lerer',
            repo: 'veracode-async',
            //issue_number: 5,
            //body: 'Issue comment',
            //title: 'Issue title'
        });
  
        console.log(res);
    } catch (e) {
        console.log('=======================   ERROR   ===============================');
        console.log(e);
    }
    console.log('listRepoIssue - END');
};

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
    listRepoIssue,
    createNewCheckRun,
    baseSQSMessageFromGithubEvent,
    updateNewCheckRun
}