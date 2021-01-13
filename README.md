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
2) Configure the Serverless Framework to your AWS Account
3) Create a Github Application - simple than it sound
4) Clone the repository and update few attributes
5) Create an AWS Secret to encrypt and store few attributes 
6) Deploy the stack with 'serverless deploy'
7) Configure your repositories to call the notifier

