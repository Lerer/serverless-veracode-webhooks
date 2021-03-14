# Veracode Serverless Webhooks - For GitHub workflows
[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com) [![Maintained by Yaakov Lerer](https://img.shields.io/badge/maintained%20by-Lerer-brightgreen)](http://www.github.com/lerer) [![GitHub issues](https://img.shields.io/github/issues/lerer/serverless-veracode-webhooks/enhancement?color=9cf)](https://github.com/Lerer/serverless-veracode-webhooks/issues?q=is%3Aopen+is%3Aissue+label%3Aenhancement) [![GitHub issues](https://img.shields.io/github/issues/lerer/serverless-veracode-webhooks/bug?color=red)](https://github.com/Lerer/serverless-veracode-webhooks/issues?q=is%3Aopen+is%3Aissue+label%3Abug) [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=Lerer_serverless-veracode-webhooks&metric=alert_status)](https://sonarcloud.io/dashboard?id=Lerer_serverless-veracode-webhooks)

## Purpose
The purpose of the repository is to enable customers who want to use the full veracode Static scan (not the Pipeline or the IDE scans) and get updates back in an asynchronious method.

__Note__ - The solution supports __only__ GitHub workflow triggered by `push` and `pull_request`.

## Output Example:
<p align="center">
  <img src="https://github.com/lerer/serverless-veracode-webhooks/blob/master/resources/push-summary-heading-uas.png?raw=true" width="350px" alt="Github Push check"/>
</p>
  
<p align="center">
  <img src="https://github.com/lerer/serverless-veracode-webhooks/blob/master/resources/push-check-output-sca.png?raw=true" width="600px" alt="Github Push check"/>
</p>

### Import findings
__A button was added as part of scan result report to request for issues to be created based on the scan findings which impact policy__
<p align="center">
  <img src="https://github.com/lerer/serverless-veracode-webhooks/blob/master/resources/import-findings-button.png?raw=true" width="350px" alt="Import findings button"/>
</p>

__Post finding import the list of issues will get populated with the veracode issues:__
<p align="center">
  <img src="https://github.com/lerer/serverless-veracode-webhooks/blob/master/resources/issues-list.png?raw=true" width="600px" alt="Issues list"/>
</p>

__Each iten in the list will rander an issue with the following details:__
<p align="center">
  <img src="https://github.com/lerer/serverless-veracode-webhooks/blob/master/resources/issue-details.png?raw=true" width="800px" alt="Issue details"/>
</p>

> Note - the solution was limited to import up to 250 issues from veracode into Github

## The solution will act as out-of-band process 
  - You don't need to wait for the scan to finish in order to get the results in your PR
  - Build pipeline time is not impacted (besides upload time)
<p align="center">
  <img src="https://github.com/lerer/serverless-veracode-webhooks/blob/master/resources/build-pipeline-run.png?raw=true" width="600px" alt="Build pipeline run times"/>
</p>

## The implementation
The repository contains an implementation of SERVERLESS framework which can deploy a set of (24) resources in a chosen AWS region.
resources:  

### endpoints: 
  - POST - https://\<AWS API ID\>.execute-api.\<region\>.amazonaws.com/\<stage\>/github
### functions:
  - **githubListener:** {project}-{stage}-githubListener   
  - **veracodeForGithubBuildProcessor:** {project}-{stage}-veracodeForGithubBuildProcessor    
### Queues:
  - ScanChecks
### IAM
  - **{project}-{stage}-{region}-lambdaRole** - a role which allows the above lambda functions access to logs and the above (only) queue
     
       
        
## Installation instructions:
To utilize the content, you will need to implement the following:  
1) Install NodeJS, NPM, and the [Serverless Framework]('https://www.serverless.com/framework/docs/getting-started/' 'Serverless Framework')
2) Clone the repository
3) Creation of AWS deployment role
4) Configure the Serverless Framework to your AWS Account (using the pre-defined deployment role)
5) Create a Github Application Definition      
6) __WIP__ - Create an AWS Secret to encrypt and store few attributes
7) Update few Environment Variable
8) Deploy the stack with 'serverless deploy'
9) Configure your repositories pipeline to call the notifier

## Installation details:
### 1. install NodeJS, NPM, and Serverless

1. Use the following links and follow the instruction to install the LTS version:
   - [NodeJS (with NPM)](https://nodejs.org/en/)
   - [Serverless](https://www.serverless.com/framework/docs/getting-started/ 'Serverless Framework')
2. If you don't have account in SERVERLESS, please create one (it is free)
3. From your command line login to your account using `serverless login` and follow the instructions

### 2. Clone, Update and Deploy
1. Clone this repository: `git clone https://github.com/lerer/serverless-veracode-webhooks`
2. Import dependencies by executing `npm install`
3. Copy `empty.env` to `.env` and update the attributes
   - AWS_Region=`<Your AWS deployment region>`
   - AWS_Account_ID=`<Your AWS Account ID (Numeric)>`
   - Stage=`<dev|prod>`


### 3. AWS Policy for the deployment of the solution
In order to provided the minimun policy required for the deployment of the solutions, we will need to generate a Policy. 

1. Run the command: __`npm run generate-permissions`__ which will generate a JSON format policy.
   - This will only work correctly if you filled-in the environment variable in the previous stage
   - The policy is generates in the project root directory inside a file: __`policy.json`__
2. Login to your AWS portal, navigate IAM Service and create a new policy
   1. Paste the `policy.json` file content into the JSON area of the policy. (Don't use the Visual editor).
   2. Save the policy

__Additional resources:__
Serverless framework (this project), need a role in AWS which will allow it to deploy its resources. An easy example can be found here:
- [Customizing your IAM Policy](https://seed.run/docs/customizing-your-iam-policy.html)

Example with explanaition how to deploy custom AWS IAM role:
- [Customize the Serverless IAM Policy](https://serverless-stack.com/chapters/customize-the-serverless-iam-policy.html)

Online Policy Generator
- [Serverless Permission Policy Generato](https://open-sl.github.io/serverless-permission-generator/)
> Note - the above generator may miss or generate over permissive policy

      
### 4. Configure Serverless to deploy to your AWS account

Serverless framework has few options to configure it. The method I tested was a manual deployment from my desktop. 

_If you plan to actively develop further the code here, you may want to look into setting CI/CD inside Serverless_


1) Create an AWS account for Serverless using the policy created in the previous stage: [Creating an IAM user in your AWS account
](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users_create.html)
   - Select `programmatic access` for user type 
2) Save the `Access Key ID` and `Secret Access Key`
3) __Connect your Serverless to AWS using the new user using the instructions in the [credentials configuration](https://www.serverless.com/framework/docs/providers/aws/cli-reference/config-credentials/)__
 

### 5. The GitHub Application
Now that we have the AWS account pre-set, linked to Serverless - we are ready to deploy. However, in order to provide access back to GitHub, we need to enable permissions.    
We will do that by creating an Application in the GitHub account.

1. In your Github account, create an application using the following instructions [Creating a GitHub App](https://docs.github.com/en/developers/apps/creating-a-github-app)     
   * Name: "`My Veracode`"
   * Homepage: "`http://www.veracode.com`"
   * Uncheck the `Active` checkbox in the Webhook section
   * Permissions:
     * Checks: `Read & Write`
     * Metadata: `Read-only`
2. Make a note of the GitHub Application ID as we will need it to configure our solution.
   * See `App ID: <XXXXXX>` at the `General` -> `about` section of the application you just created 
   * In addition, observe the URL for the app name `https://github.com/settings/apps/[GITHUB_APP_NAME]`
3. Genrate a private key for the application and save it. We will need it to get our serverless solution access to the repositories. (Scroll down to the bottom of the General sections of the Application)
   * Use the following instructions: [Generating a private key](https://docs.github.com/apps/building-github-apps/authentication-options-for-github-apps/#generating-a-private-key)
4. Install the application you created
   * At the application settings, click on install App
   * On the right, click on the `install` button
   * Select either `All repositories`, or `Only select repositories`. 
     * If you decide to work with selected repository, you will have to maintain the list of allowed repositories.
   * Make a note for the `installation id` which can be found at the installation configuration URL 
     * navigate to your github account settings
     * Select `Applications`
     * Click on the `Configure` button for the application you created and installed
     * The page URL will look as follow: `http://github.com/settings/installations/XXXXXXXX`. The number at the end of the URL path is you `installation id`


### 6. Create an AWS Secret to encrypt and store few attributes
<details><summary>WIP - Will update once is ready</summary> <p> 
> Skip this stage until it will be ready 
</p>
</details>

### 7. Update more environment variables
1. In `.env` and update the attributes
   * API_ID=[Veracode API Key]
   * API_KEY=[Veracode API Secret]
   * PEM=[content of the private key created at #5.3.]
     * The format will be `-----BEGIN RSA PRIVATE KEY----- MIIEpAIBAAKASJEAn08WHUF27jUocPGwVVLxOo.. ... I2l3ZJctx5YsxHhtFvA8jFdsRDYe0Oz66Nt2453PEIF42fH26gtLjFSbrKrxGcti 4Or54WvL0y2+UXi5pQkcvoaMfa4yx61blSqZAQw1a4aWLGyz+8AvAg== -----END RSA PRIVATE KEY-----`.
     * __Single space__ separated and __NOT__ newline separated! 
   * GITHUB_APP_NAME=[Application Name you noted at #5.2]
   * GITHUB_APP_ID=[Application ID gathered at #5.2]
   * GITHUB_APP_INSTALL_ID=[Application installation ID gathered at #5.4]
2. (Optional) If you logged in to the SERVERLESS dashboard (free), and would like to view and monitor API endpoint and functions invocation:
   * Login to your Serverless account 
   * Create an application. When asked for template, select `serverless framework`. 
     * Use __`my-veracode`__ for `application name`
   * Modify your `serverless.yml` file in the solution directory and override the following:
     * app: [Your new `application name`]
     * org: [Your SERVERLESS account id as shown on your dashboard]
3. If you choose to skip the previous step (#7.3), comment out (using # in front of the line) attributes `app` and `org` in your `serverless.yml`.
4. Navigate to `package.json` file and update the deploy scripts with your own AWS deployment region 
    __Here:__
    ```JSON
    "scripts": {
      ...
      "deploy-dev": "sls deploy --stage dev --region ap-southeast-2",
      "deploy": "sls deploy --stage prod --region ap-southeast-2",  
      ...
    }
    ```

### 7. Deploy the solution to AWS 
* Run the deployment command
  * If you deploy in dev: __`npm run deploy-dev`__
  * If you deploy as production: __`npm run deploy`__
* Pay attenbtion to the deployment output for error
* look for the `Service Information` section and note the `endpoint` which should look similar to: 
  * `POST - https://kjhkjhz7l8.execute-api.ap-southeast-2.amazonaws.com/dev/github`

### 8. Configure Webhook
To support further actions such as request to import findings, please update the GitHub application settings with the same Webhook URL you got from the `endpoint` URL collected at stage 7

### 9. Configure your repositories pipeline to call the notifier
The following steps will take you through the GitHub workflow configuration to call the deployed solution.
> Important - this step will only work if you configure the workflow for a repository which is permitted access when you install the GitHub application __#5.4__

Since the solution _act as_ asynchronic WebHook, we can send a full scan to the Veracode platform without waiting for it to complete.

   * Add the following attributes as repository SECRET
     * `WEBHOOK_SECRET` - Secret for github webhook which should be same as the one you applied in the Github Application Webhook secret
   * In your Github workflow configuration, use the official __[upload-and-scan](https://github.com/marketplace/actions/veracode-upload-and-scan)__ action to trigger a full scan
   * When you configure the above __action__, set:
     * `version: ${{ github.run_id }}`
     * `scantimeout: 0` 
       * (or don't include `scantimeout` at all)
   * immidiatly after the upload and scan configure the following __action__
     ```yml
       - name: Invoke deployment hook
         uses: distributhor/workflow-webhook@v1
         env:
           webhook_type: 'json-extended'
           webhook_url: <WEBHOOK_URL>  // the endpoint URL collected at stage 7
           webhook_secret: ${{ secrets.WEBHOOK_SECRET }}
           data: '{"commit":"${{github.sha}}","run_id":"${{github.run_id}}","veracode_app_name":"veracode-async"}' 
           #"veracode_sandbox_name":"My Sandbox"}'
      ```

      The `data` attribute is a <ins>__single line__</ins> of the following JSON:

      ```JSON with Comments
      {
        "commit": "${{github.sha}}", // or the scan name
        "run_id":"${{github.run_id}}", // The run id to report back the results
        "veracode_app_name":"veracode-async", // The application name
        "veracode_sandbox_name":"Sandbox 1" // The sandbox name. Don't include if using policy scan!
      }
      ```

# Done!!!
> Test you workflows and scan your repositories

-------
**Note** - To remove all resources deployed by this solution, simply run **`serverless remove`**
