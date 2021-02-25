# Veracode Serverless Webhooks - For GitHub workflows
[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com) [![Maintained by Yaakov Lerer](https://img.shields.io/badge/maintained%20by-Lerer-brightgreen)](http://www.github.com/lerer) [![GitHub issues](https://img.shields.io/github/issues/lerer/serverless-veracode-webhooks?color=orange)](https://github.com/Lerer/serverless-veracode-webhooks/issues)

## Purpose
The purpose of the repository is to enable customers who want to use the full veracode Static scan (not the Pipeline or the IDE scans) and get updates back in an asynchronious method.

__Note__ - The solution supports __only__ GitHub workflow triggered by `push` and `pull_request`.

## Output Example:
<p align="center">
  <img src="https://github.com/lerer/serverless-veracode-webhooks/blob/master/resources/push-summary-heading.png?raw=true" width="350px" alt="Github Push check"/>
</p>
  
<p align="center">
  <img src="https://github.com/lerer/serverless-veracode-webhooks/blob/master/resources/push-check-output.png?raw=true" width="600px" alt="Github Push check"/>
</p>

## The Savings
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
2) Creation of AWS deployment role
3) Configure the Serverless Framework to your AWS Account (using the pre-defined deployment role)
4) Create a Github Application Definition      
5) __WIP__ - Create an AWS Secret to encrypt and store few attributes
6) Clone the repository and update few attributes
7) Deploy the stack with 'serverless deploy'
8) Configure your repositories pipeline to call the notifier

## Installation details:
### 1. install NodeJS, NPM, and Serverless

1. Use the following links and follow the instruction to install the LTS version:
   - [NodeJS (with NPM)](https://nodejs.org/en/)
   - [Serverless](https://www.serverless.com/framework/docs/getting-started/ 'Serverless Framework')
2. If you don't have account in SERVERLESS, please create one (it is free)
3. From your command line login to your account using `serverless login` and follow the instructions

### 2. AWS Policy for the deployment of the solution

Get your own policy using online generator:
- [Serverless Permission Policy Generator](https://open-sl.github.io/serverless-permission-generator/)

1. For the above customize policy, use the following settings:
   1. Serverless Project Name: `github-status-check`
   2. AWS Account ID: `<Your AWS account ID>`
   3. AWS Region: `<AWS region you will deploy the solution into>`
   4. Application Stage: `<dev|prod>`
   5. Check the `Amazon API Gateway` checkbox
   6. Click on `Generate`
   7. `COPY TO CLIPBOARD`
2. Head to AWS IAM and create a new policy
   1. Paste the clipboard content into the JSON area. (Don't use the Visual editor).
   2. Modify the `arn:aws:iam::<Account ID>:role/github-status-check-<stage>-<region>-lambdaRole` and replace with `arn:aws:iam::<Account ID>:role/github-status-check-<stage>-<region>-*`
   3. Add the following section to the policy and replace with your own `Account ID` and `Region`:
      ```json
      {
        "Effect": "Allow",
        "Action": "sqs:*",
        "Resource": [
          "arn:aws:sqs:<Region>:<Account ID>:ScanChecks"
        ]
      },
      {
        "Effect": "Allow",
        "Action": "logs:PutSubscriptionFilter",
        "Resource": [
          "arn:aws:logs:<Region>:<Account ID>:log-group:/aws/lambda/*",
          "arn:aws:logs:<Region>:<Account ID>:log-group:/aws/api-gateway/*"
        ]
      },
      {
        "Effect": "Allow",
        "Action": "lambda:CreateEventSourceMapping",
        "Resource": "*"
      }
   4. Save the policy

__Additional resources:__
Serverless framework (this project), need a role in AWS which will allow it to deploy its resources. An easy example can be found here:
- [Customizing your IAM Policy](https://seed.run/docs/customizing-your-iam-policy.html)

Example with explanaition how to deploy custom AWS IAM role:
- [Customize the Serverless IAM Policy](https://serverless-stack.com/chapters/customize-the-serverless-iam-policy.html)

      
### 3. Configure Serverless to deploy to your AWS account

Serverless framework has few options to configure it. The method I tested was a manual deployment from my desktop. 

_If you plan to actively develop further the code here, you may want to look into setting CI/CD inside Serverless_


1) Create an AWS account for Serverless using the policy created in the previous stage: [Creating an IAM user in your AWS account
](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users_create.html)
   - Select `programmatic access` for user type 
2) Save the `Access Key ID` and `Secret Access Key`
3) Connect your Serverless to AWS using the new user using the instructions in the [credentials configuration](https://www.serverless.com/framework/docs/providers/aws/cli-reference/config-credentials/)
 

### 4. The GitHub Application
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

### 5. Create an AWS Secret to encrypt and store few attributes
WIP - Will update once is ready   
> Skip this stage until it will be ready 

### 6. Clone, Update and Deploy
1. Clone this repository: `git clone https://github.com/lerer/serverless-veracode-webhooks`
2. Copy `empty.env` to `.env` and update the attributes
   * API_ID=[Veracode API Key]
   * API_KEY=[Veracode API Secret]
   * PEM=[content of the private key created at #4.3.]
     * The format will be `-----BEGIN RSA PRIVATE KEY----- MIIEpAIBAAKASJEAn08WHUF27jUocPGwVVLxOo.. ... I2l3ZJctx5YsxHhtFvA8jFdsRDYe0Oz66Nt2453PEIF42fH26gtLjFSbrKrxGcti 4Or54WvL0y2+UXi5pQkcvoaMfa4yx61blSqZAQw1a4aWLGyz+8AvAg== -----END RSA PRIVATE KEY-----`.
     * __Single space__ separated and __NOT__ newline separated! 
   * GITHUB_APP_ID=[Application ID gathered at #4.2]
   * GITHUB_APP_INSTALL_ID=[Application installation ID gathered at #4.4]
3. (Optional) If you logged in to the SERVERLESS dashboard (free), and would like to view and monitor API endpoint and functions invocation:
   * Login to your Serverless account 
   * Create an application. When asked for template, select `serverless framework`. 
     * Note the `application name`
   * Modify your `serverless.yml` file in the solution directory and override the following:
     * app: [Your new `application name`]
     * org: [Your SERVERLESS account id as shown on your dashboard]
4. If you choose to skip the previous step (#6.3), comment out (using # in front of the line) attributes `app` and `org` in your `serverless.yml`.
5. Modify `serverless.yml` and update the `region` value to your deployment region 
6. Lasstly, import all dependencies by running `npm install` in the project root directory


### 7. Deploy the solution to AWS 
* Run the deployment command: __`serverless deploy`__
* Pay attenbtion to the deployment output for error
* look for the `Service Information` section and note the `endpoint` which should look similar to: 
  * `POST - https://kjhkjhz7l8.execute-api.ap-southeast-2.amazonaws.com/dev/github`

### 8. Configure your repositories pipeline to call the notifier
The following steps will take you through the GitHub workflow configuration to call the deployed solution.
> Important - this step will only work if you configure the workflow for a repository which is permitted access when you install the GitHub application __#4.4__

Since the solution _act as_ asynchronic WebHook, we can send a full scan to the Veracode platform without waiting for it to complete.

   * Add the following attributes as repository SECRET
     * `WEBHOOK_SECRET` - Secret for github webhook
   * In your Github workflow configuration, use the official __[upload-and-scan](https://github.com/marketplace/actions/veracode-upload-and-scan)__ action to trigger a full scan
   * When you configure the above __action__, set:
     * `version: ${{ github.run_id }}`
     * `scantimeout: 0`
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

      ```json
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
