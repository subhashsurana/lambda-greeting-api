import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as subscription from 'aws-cdk-lib/aws-sns-subscriptions';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import path = require('path');


export class LambdaGreetingApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // "Greeting" SNS Topic
    const greetingsTopic = new sns.Topic(this, 'GreetingsTopic');

    // "Greeting" SQS Topic
    const greetingsQueue = new sqs.Queue(this, 'GreetingsQueue',{
      visibilityTimeout: cdk.Duration.seconds(300)
    });

    // Subscribe the Queue to the SNS Topic 
    greetingsTopic.addSubscription(new subscription.SqsSubscription(greetingsQueue))

    // Greeting Lambda Function
    const greetingLambda = new NodejsFunction(this, 'lambdaGreetFunction', {
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/lambdaGreetFunction.ts'),
      runtime: lambda.Runtime.NODEJS_18_X,
      bundling: {
        minify: true,
      },
      environment: {
        SNS_TOPIC_ARN: greetingsTopic.topicArn
      }
    });

    // Allow the Lambda to publish to SNS 
    greetingsTopic.grantPublish(greetingLambda);
  
    // API Gateway with /greeting endpoint
    const apigw = new apigateway.LambdaRestApi(this, 'LambdaGreetApi', {
      handler: greetingLambda,
      proxy: false,
      restApiName: "LambdaGreetApi",
      description: "API fo Lambda Greeting Function"
    });

    // Adding resource greeting and 'GET' Method
    const greetResource = apigw.root.addResource('greeting')
    greetResource.addMethod('GET',new apigateway.LambdaIntegration(greetingLambda));

    // Another Lambda triggered by SQS Queue
    const sqsConsumerLambda = new NodejsFunction(this, 'sqsConsumerLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/sqsConsumerLambda.ts'),
      bundling: {
        minify: true
      },
    });

    // Add SQS Queue as an event source to the second Lambda
    sqsConsumerLambda.addEventSource(new SqsEventSource(greetingsQueue));

    new cdk.CfnOutput(this, 'GreetLambdaFunction', {
      value: greetingLambda.functionName,
      description: 'JavaScript Lambda function'
  });

  new cdk.CfnOutput(this, 'LambdaGreetApiEndpoint', {
    value: apigw.url + 'greeting',
    description: 'The API Gateway endpoint for the /greeting resource',
  });


  }
}
