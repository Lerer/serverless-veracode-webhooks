'use strict';

const { Octokit } = require("@octokit/rest");
const { createAppAuth } = require("@octokit/auth-app");
const fs = require('fs');

// const octokit = new Octokit({
//   auth: "mypersonalaccesstoken123",
// });


const testCommitComment = () => {
    
}

const testIssuesList = async () => {
    var pem = fs.readFileSync('./test-veracode-with-lambda.2021-01-03.private-key.pem', 'utf8');
  
    const appOctokit = new Octokit({
        authStrategy: createAppAuth,
        auth: {
            //type:"app",
            appId: 94775,
            privateKey: pem,
          // optional: this will make appOctokit authenticate as app (JWT)
          //           or installation (access token), depending on the request URL
            installationId: 13893866,
        },
        //type: "app"
    });

    const authRes = await appOctokit.auth({
        type: "installation",
        // defaults to `options.auth.installationId` set in the constructor
        //installationId: 13893866,
    });
      
    
    try {
     
      
        const res = await appOctokit
        //.request('GET /repos/{owner}/{repo}/issues/{issue_number}', {
            .issues.createComment({
            owner: 'Lerer',
            repo: 'veracode-async',
            issue_number: 5,
            body: 'Issue comment',
            //title: 'Issue title'
        });
  
    console.log(res);
    } catch (e) {
        console.log('======================================================')
        console.log(e);
    }
};


testIssuesList();