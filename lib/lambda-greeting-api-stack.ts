import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as subscription from 'aws-cdk-lib/aws-sns-subscriptions';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import path = require('path');


export class LambdaGreetingApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Get context values (environmentType could be 'staging' or 'production')
    const environmentType = this.node.tryGetContext('environmentType');

    // env_suffix all resource names with environment type
    
    const env_suffix = environmentType === 'production' ? 'prod' : 'staging';


    // "Greeting" SNS Topic
    const greetingsTopic = new sns.Topic(this, `GreetingsTopic${env_suffix}`,);

    // "Greeting" SQS Topic
    const greetingsQueue = new sqs.Queue(this, `GreetingsQueue${env_suffix}`,{
      visibilityTimeout: cdk.Duration.seconds(300)
    });

    // Subscribe the Queue to the SNS Topic 
    greetingsTopic.addSubscription(new subscription.SqsSubscription(greetingsQueue))

    // Greeting Lambda Function
    const greetingLambda = new NodejsFunction(this, `lambdaGreeting-${env_suffix}`, {
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/lambdaGreeting.ts'),
      runtime: lambda.Runtime.NODEJS_18_X,
      bundling: {
        minify: true,
        nodeModules: ['aws-sdk','lorem-ipsum'], 
      },
      environment: {
        SNS_TOPIC_ARN: greetingsTopic.topicArn
      },
      memorySize: environmentType === 'production' ? 1024 : 512,  // Different memory size based on environment
    });

    // Create Lambda version & alias for Blue-Green Deployment
    const lambdaVersion = greetingLambda.currentVersion;
    const greetingLambdaAlias = new lambda.Alias(this, `GreetingLambdaAlias-${env_suffix}`, {
      aliasName: 'live',
      version: lambdaVersion
    });


    // Allow the Lambda to publish to SNS 
    greetingsTopic.grantPublish(greetingLambda);
  
    // API Gateway with /greeting endpoint
    const apigw = new apigateway.LambdaRestApi(this, `lambdaGreetingApi-${env_suffix}`, {
      handler: greetingLambda,
      proxy: false,
      restApiName: `lambdaGreetingApi-${env_suffix}`,
      description: "API fo Lambda Greeting Function",
      deployOptions: {
        stageName: `${env_suffix}`
      }
    });

    // Adding resource greeting and 'GET' Method
    const greetResource = apigw.root.addResource('greeting')
    greetResource.addMethod('GET',new apigateway.LambdaIntegration(greetingLambdaAlias));

    // CodeDeploy for Blue-Green Deployment (Staging: Fast, Production: Linear)
    const DeployStrategy = 
    environmentType === 'production'
    ? codedeploy.LambdaDeploymentConfig.LINEAR_10PERCENT_EVERY_10MINUTES // Linear for Production
    : codedeploy.LambdaDeploymentConfig.LINEAR_10PERCENT_EVERY_1MINUTE // Faster for staging

    new codedeploy.LambdaDeploymentGroup(this, `GreetingLambdaDeploymentGroup-${env_suffix}`, {
      alias: greetingLambdaAlias,
      deploymentConfig: DeployStrategy,
      autoRollback: {
        failedDeployment: true,
      },
    });

    // Another Lambda triggered by SQS Queue
    const sqsConsumerLambda = new NodejsFunction(this, `sqsConsumerLambda-${env_suffix}`, {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/sqsConsumerLambda.ts'),
      bundling: {
        minify: true
      },
    });

    // Add SQS Queue as an event source to the second Lambda
    sqsConsumerLambda.addEventSource(new SqsEventSource(greetingsQueue));

    
    // Create Lambda Version and Alias for Blue-Green Deployment
    const sqsConsumerLambdaVersion = sqsConsumerLambda.currentVersion;
    const sqsConsumerLambdaAlias = new lambda.Alias(this, `SQSConsumerLambdaAlias-${env_suffix}`, {
      aliasName: 'live',
      version: sqsConsumerLambdaVersion,
    });

     // CodeDeploy: Lambda Blue-Green Deployment for sqsConsumerLambda
     new codedeploy.LambdaDeploymentGroup(this, `SQSConsumerLambdaDeploymentGroup-${env_suffix}`, {
      alias: sqsConsumerLambdaAlias,
      deploymentConfig: DeployStrategy,
      autoRollback: {
        failedDeployment: true,
      },
    });

    new cdk.CfnOutput(this, `GreetLambdaFunction-${env_suffix}`, {
      value: greetingLambda.functionName,
      description: 'JavaScript Lambda function'
    });

    new cdk.CfnOutput(this, `lambdaGreetingApiEndpoint-${env_suffix}`, {
      value: apigw.url + 'greeting',
      description: 'The API Gateway endpoint for the /greeting resource',
    });


  }
}
