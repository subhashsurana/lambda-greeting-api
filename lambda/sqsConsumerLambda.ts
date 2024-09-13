import { SQSHandler } from 'aws-lambda';

export const handler: SQSHandler = async (event) => {
    for (const record of event.Records) {
        // Parse the message body as JSON

        // The message body uses '||' as the separator, so split based on that
        const message = record.body;
        const parts = message.split('||') // Split the string based on the '||' separator

        if (parts.length == 2) {
            const greeting = parts[0].replace('Greeting: ', '');    // Extract the greeting
            const visitorIp = parts[1].replace('Visitor IP: ', ''); // Extract the visitor's IP Address

            // Log the information
            console.log(`Received greeting: ${greeting}`);
            console.log(`Visitor IP: ${visitorIp}`);
        } else {
            console.error('Failed to parse message body:', message);
        }
         
    }
}