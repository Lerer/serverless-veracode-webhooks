'use strict';

const githubAPIHandler = require('../../helper/githubAPIHandler');

const CHECK_NAME = 'Veracode Upload and Scan';
const CHECK_RESULT_TITLE = `${CHECK_NAME} Results`;

const CONCLUSION = {
    SUCCESS : 'success', 
    FAILURE: 'failure',
    NATURAL:  'neutral', 
    CANCELLED: 'cancelled', 
    SKIPPED: 'skipped', 
    TIME_OUT: 'timed_out', 
    ACTION_REQUIRED: 'action_required'
}

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

    } catch (e) {
        console.log('===========   ERROR   ===============================');
        console.log(e);
    }
    console.log('updateNewCheckRun - END');
    return check;
}

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
    createCheckRun,
    baseSQSMessageFromGithubEvent,
    updateCheckRun,
    CHECK_RESULT_TITLE,
    CONCLUSION
}