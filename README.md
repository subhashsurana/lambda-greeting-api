# Lambda Greeting API with Blue-Green Deployment (AWS CDK)
## Overview

This project implements a serverless architecture using AWS CDK (Cloud Development Kit) in TypeScript. It provides a greeting service that leverages API Gateway, Lambda, SNS, SQS, and integrates with AWS CodeDeploy for blue-green deployments.

The project supports two environments: Staging and Production, and features a blue-green deployment strategy with CloudWatch Alarms to monitor failures and trigger notifications.
## Features

- API Gateway: Provides a RESTful API endpoint /greeting that triggers a Lambda function to generate a random greeting.
- Lambda Functions:
    - Greeting Lambda: Generates random greetings and publishes them to an SNS topic.
    - SQS Consumer Lambda: Consumes messages from an SQS queue and logs the messages.
- SNS Topic: Publishes the generated greeting messages.
- SQS Queue: Receives messages from the SNS topic.
- Blue-Green Deployment:
    - Staging Environment: Faster deployment strategy (50% traffic shift every 1 minute).
    - Production Environment: Cautious linear deployment strategy (10% traffic shift every 10 minutes).
- Automatic Rollbacks: CodeDeploy automatically rolls back in case of deployment failures.
- CloudWatch Alarms: Monitor deployment failures and Lambda errors, with notifications sent via SNS.

## Architecture

![Architecture Diagram](https://raw.githubusercontent.com/subhashsurana/lambda-greeting-ap/main/images/AWS_Lambda_Greetings_Serverless_API_Blue_Green_Deployment.png)

-   API Gateway: Provides a /greeting endpoint.
-   Greeting Lambda: Handles API requests, generates greetings, and sends them to an SNS Topic.
- SNS: Publishes the greeting message to subscribers.
- SQS: Receives messages from SNS.
- SQS Consumer Lambda: Processes messages from the SQS Queue and logs them.

## Prerequisites

To deploy this project, you need the following:

- AWS CDK: Install AWS CDK globally using npm:

    

        npm install -g aws-cdk


- AWS Account: Ensure you have an AWS account with the necessary permissions to deploy resources such as Lambda, SNS, SQS, API Gateway, and CodeDeploy.
AWS CLI: Set up your AWS CLI with the appropriate credentials:



        aws configure

- Node.js: Install Node.js (v14 or later).
TypeScript: Install TypeScript globally using npm:


        npm install -g typescript

## Setup

1. Clone the repository:

        git clone https://github.com/subhashsurana/lambda-greeting-api.git
        cd lambda-greeting-api

2. Install dependencies:

        npm install

3. Bootstrap CDK environment: If this is your first time deploying CDK in your AWS account/region, you need to bootstrap the environment:

        cdk bootstrap

4. Configure environments (Staging/Production): The project supports separate Staging and Production environments. You can configure the environment by setting the ENVIRONMENT variable during deployment.

## Deployment
### Deploy to Staging

To deploy the project to the Staging environment:


    ENVIRONMENT=staging cdk deploy

- The staging deployment uses a faster blue-green deployment strategy (50% traffic shift every minute).

### Deploy to Production

To deploy the project to the Production environment:

    ENVIRONMENT=production cdk deploy

- The production deployment uses a linear deployment strategy (10% traffic shift every 10 minutes).

### Destroy the Deployment

To destroy the stack and all associated resources:

    cdk destroy

## Testing the Deployment
### API Gateway

Once deployed, you can test the API Gateway by hitting the /greeting endpoint:

    curl https://<api-id>.execute-api.<region>.amazonaws.com/<stage>/greeting

You should receive a greeting message in the response.
## Monitor Blue-Green Deployment

1. AWS CodeDeploy Console:
    - Navigate to the AWS CodeDeploy Console to monitor the   
    blue-green deployment process and traffic shifting.
2. CloudWatch Logs:
    - Review the logs for both GreetingLambda and SQSConsumerLambda in CloudWatch Logs to verify successful execution and log messages.

### CloudWatch Alarms and Notifications

CloudWatch alarms are configured to monitor Lambda errors and deployment failures. Notifications are sent via SNS to the configured email address.

- You can view the alarms in the CloudWatch Console.
- Email notifications are sent for any failures or errors during deployment.

### CfnOutput Resources

The stack exposes several key resources via CfnOutput:

- API Gateway Endpoint URL:
    - Provides the URL to access the /greeting endpoint.

- Lambda Function Names:
    - Name of GreetingLambda.
    - Name of SQSConsumerLambda.

- SNS Topic Name:
    - Name of the SNS Topic (`GreetingsTopic`)
    - Name of the SNS Topic (`AlarmTopic`)

- SQS Queue URL:
    - URL of the SQS Queue (`GreetingsQueue`)

- CloudWatch Alarm URLs:
    - URLs for the CloudWatch alarms monitoring the Lambda deployments.

## Troubleshooting
### Common Errors

- Naming Conflicts: Ensure that all constructs (Lambdas, SNS, SQS, etc.) are prefixed with an environment-specific identifier (e.g., Prod or Staging) to avoid naming conflicts.
- Deployment Failures: Use the CodeDeploy Console and CloudWatch Logs to diagnose any issues with the blue-green deployment. If a deployment fails, check the CloudWatch alarms for details.
### Rollback Testing (Optional)

To test a rollback scenario:

1. Introduce an error in the Lambda function (e.g., a syntax or runtime error).
2. Deploy the faulty version in Staging.
3. Check for CloudWatch Alarms being triggered.
4. Ensure that CodeDeploy rolls back the deployment automatically.




## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
