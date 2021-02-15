# Veracode Serverless Responder

## Purpose
The purpose of the repository is to enable customers who want to use the full veracode Static scan (not the Pipeline or the IDE scans) and get updates back in an asynchronious method.

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
4) Create a Github Application - simple than it sound
5) Clone the repository and update few attributes
6) Create an AWS Secret to encrypt and store few attributes 
7) Deploy the stack with 'serverless deploy'
8) Configure your repositories to call the notifier

## Installation details:
### 1. install NodeJS, NPM, and Serverless
Use the following links and follow the instruction to install the LTS version:
- [NodeJS (with NPM)]('https://nodejs.org/en/')
- [Serverless]('https://www.serverless.com/framework/docs/getting-started/' 'Serverless Framework')

### 2. AWS Role for the deployment of the solution

Serverless framework (this project), need a role in AWS which will allow it to deploy its resources. An easy example can be found here:
- [Customizing your IAM Policy]('https://seed.run/docs/customizing-your-iam-policy.html')

Example with explanaition how to deploy custom AWS IAM role:
- [Customize the Serverless IAM Policy]('https://serverless-stack.com/chapters/customize-the-serverless-iam-policy.html')

Get your own policy using online generator:
- [Serverless Permission Policy Generator](https://open-sl.github.io/serverless-permission-generator/)

Once a policy added to the AWS account, create a user with the newly create policy. That user will be used by our Serverless framework to create all required resources.
   
      
      
### 3. Configure Serverless to deploy to your AWS account
