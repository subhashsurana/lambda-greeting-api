#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LambdaGreetingApiStack } from '../lib/lambda-greeting-api-stack';

const app = new cdk.App();
new LambdaGreetingApiStack(app, 'LambdaGreetingApiStack', {
});