import { Mistral } from '@mistralai/mistralai';
import dotenv from 'dotenv';

dotenv.config();

const client = new Mistral({
    apiKey: process.env.MISTRAL_API_KEY,
});


const messages = [
    {
        role: "user" as const,
        content: "give me the current weather of lucknow!"
    }
];

const completionArgs = {
    temperature: 0.7,
    maxTokens: 2048,
    topP: 1
};


function getWeather(location: string) {
    console.log("fn", location);

    return {
        location,
        temperature: "28°C",
        condition: "Sunny"
    };
}

const tools = [
    {
        type: "function" as const,
        function: {
            name: "get_weather",
            description: "Get the current weather for a location",
            parameters: {
                type: "object" as const,
                properties: {
                    location: {
                        type: "string" as const,
                        description: "City name"
                    },
                    unit: {
                        type: "string" as const,
                        enum: ["celsius", "fahrenheit"]
                    }
                },
                required: ["location"]
            }
        }
    }
];


export async function basicFnCalling() {
    // Start the conversation
    const response = await client.beta.conversations.start({
        inputs: messages,
        model: 'mistral-medium-latest',
        instructions: ``,
        ...completionArgs,
        tools
    });

    const toolCall = response.outputs?.[0];
    if (!toolCall) throw new Error("object not found");

    if (toolCall?.type === "function.call") {
        const parsedArgs = JSON.parse(toolCall.arguments as string);

        if (toolCall.name === "get_weather") {
            const result = getWeather(parsedArgs.location);
            console.log("Tool result:", result);

            const final = await client.beta.conversations.append({
                conversationId: response.conversationId,
                conversationAppendRequest: {
                    inputs: [
                        {
                           
                            result: JSON.stringify(result),
                            toolCallId: toolCall.toolCallId
                        }
                    ],
                    completionArgs: {
                        ...completionArgs
                    }
                }
            });
            const  output = JSON.parse(JSON.stringify(final.outputs[0]))
            console.log(output.content);

        }
    }
}

