#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LambdaGreetingApiStack } from '../lib/lambda-greeting-api-stack';

const app = new cdk.App();

// Set environment context using construct.node.setContext()
const environment = process.env.ENVIRONMENT || 'staging';  // Use 'staging' as default
if (environment === 'production') {
    app.node.setContext('environmentType', 'production');
} else {
    app.node.setContext('environmentType', 'staging');
}

// const env = {
//     account: process.env.CDK_DEFAULT_ACCOUNT, 
//     region: process.env.CDK_DEFAULT_REGION }
// }

new LambdaGreetingApiStack(app, `LambdaGreetingApiStack-${environment}`, {
});