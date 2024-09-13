import { SNS } from "aws-sdk";
import * as LoremIpsum from 'lorem-ipsum';

// Initialize SNS 
const sns = new SNS();
const lorem = new LoremIpsum.LoremIpsum();


export const handler = async (event: any): Promise<any> => {

    console.log(`SNS Topic ARN: ${process.env.SNS_TOPIC_ARN} `);

    // Generate random Lorem Ipsum text
    const greetingsMessage = lorem.generateSentences(1);

    // Extract visitor's IP address from the API Gateway request context
    const visitorIp = event.requestContext.identity.sourceIp;

    // Concatenate the greeting and IP into a single string
    const snsMessage = `Greeting: ${greetingsMessage} || Visitor IP: ${visitorIp}`;

    // publish the message to SNS
    const snsParams = {
        Message: snsMessage,
        
        TopicArn: process.env.SNS_TOPIC_ARN
    };
    try {
        const result = await sns.publish(snsParams).promise();
    } catch (error) {
        console.error('Error publishing to SNS:', error)
    }

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: greetingsMessage,
            ip: visitorIp
        }),
    };
};