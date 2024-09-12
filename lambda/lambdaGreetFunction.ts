import { SNS } from "aws-sdk";
import * as LoremIpsum from 'lorem-ipsum';

// Initialize SNS 
const sns = new SNS();
const lorem = new LoremIpsum.LoremIpsum();


export const handler = async (event: any): Promise<any> => {

    // Generate random Lorem Ipsum text
    const greetingsMessage = lorem.generateSentences(1);

    // publish the message to SNS
    const snsParams = {
        Message: greetingsMessage,
        TopicArn: process.env.SNS_TOPIC_ARN
    };

    try {
        await sns.publish(snsParams).promise();
        console.log('Message sent to SNS:', greetingsMessage);
    } catch (error) {
        console.error('Error publishing to SNS:', error)
    }


    return {
        statusCode: 200,
        body: JSON.stringify({
            message: greetingsMessage
        }),
    };
};