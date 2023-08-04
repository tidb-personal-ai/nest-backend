import 'dotenv/config'
import {
    ChatCompletionRequestMessage,
    ChatCompletionRequestMessageRoleEnum,
    Configuration,
    OpenAIApi,
    ChatCompletionFunctions,
    ChatCompletionRequestMessageFunctionCall,
} from 'openai'

const openAiConfiguration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
})
const openAi = new OpenAIApi(openAiConfiguration)
const functions: ChatCompletionFunctions[] = [
    {
        name: 'requestExternalFunction',
        description: 'Request the execution of a functionality that goes beyond the capabilities of a language model.',
        parameters: {
            type: "object",
            properties: {
                functionDomain: {
                    type: "string",
                    enum: ["email", "calendar", "weather", "news"],
                    description: "The general category or domain of the requested function. Can be 'email' for managing emails, 'calendar' for managing calendar events, 'weather' to retrieve information about the weather, 'news' to get the latest news on any topic."
                },
                functionName: {
                    type: "string",
                    description: "The name of the specific function to be invoked."
                }
            },
            required: ["functionDomain"]
        }
    },            
    {
        name: 'remember',
        description: 'Retrieve information about past conversations with the user.',
        parameters: {
            type: "object",
            properties: {
                topic: {
                    type: "string",
                    description: "The information that is requested by the user."
                },
            },
            required: ["topic"]
        }
    },
]

async function testNegative() {
    try {
        let messages : ChatCompletionRequestMessage[] = [
            {
                role: 'system',
                content: `You are Lumi - a friendly, witty personal assistant.
    
    The users name is Luciferius. You do not need to repeat/include the user name every time you reply.
    
    Try to imitate the user's style of writing while acting according to your description.
    Do not assume that you can do anything but infering based on your learned knowledge.
    The current date is: ${new Date().toISOString()}
    
    Do not assume that you can do anything beyond providing information. For functionality beyond that use the 'requestExternalFunction' function call.
    `
            },
            {
                role: 'user',
                content: 'Hey. I was just writing an email to my good friend Lara. She asked for advice about her 9 year old son. He is very aggressive. Can you help me giove her some advice?'
            }
        ]
        let response = await openAi.createChatCompletion({
            model: 'gpt-3.5-turbo-0613',
            messages,
            functions,
            temperature: 0.5,
            top_p: 0.5,
        })
        console.log('Negative email - would be okish to be positive')
        console.log(JSON.stringify(response.data, undefined, 4))
        console.log('============================================================')
        console.log()
    } catch (error) {
        if(error.response) {
            console.log(`${error.response.status} - ${error.response.statusText}
${JSON.stringify(error.response.data, undefined, 4)}`)
        } else {
            console.log(`${error.message}
${error.stack}`)
        }
    }
}

async function test() {
    try {
        let messages : ChatCompletionRequestMessage[] = [
            {
                role: 'system',
                content: `You are Lumi - a friendly, witty personal assistant.
    
    The users name is Luciferius. You do not need to repeat/include the user name every time you reply.
    
    Try to imitate the user's style of writing while acting according to your description.
    Do not assume that you can do anything but infering based on your learned knowledge.
    The current date is: ${new Date().toISOString()}
    
    Do not assume that you can do anything beyond providing information. For functionality beyond that use the 'requestExternalFunction' function call.
    `
            },
            {
                role: 'user',
                content: 'What programming language did you suggest when we were talking about the event ticketing systems backend?'
            }
        ]
        let response = await openAi.createChatCompletion({
            model: 'gpt-3.5-turbo-0613',
            messages,
            functions,
            temperature: 0.5,
            top_p: 0.5,
        })
        console.log('Using remember')
        console.log(JSON.stringify(response.data, undefined, 4))
        console.log('============================================================')
        console.log()

        messages = [
            {
                role: 'system',
                content: `You are Lumi - a friendly, witty personal assistant.
    
    The users name is Luciferius. You do not need to repeat/include the user name every time you reply.
    
    Try to imitate the user's style of writing while acting according to your description.
    Do not assume that you can do anything but infering based on your learned knowledge.
    The current date is: ${new Date().toISOString()}
    
    Do not assume that you can do anything beyond providing information. For functionality beyond that use the 'requestExternalFunction' function call.
    `
            },
            {
                role: 'user',
                content: 'Did vivenu respond to my last email?'
            }
        ]
        response = await openAi.createChatCompletion({
            model: 'gpt-3.5-turbo-0613',
            messages,
            functions,
            temperature: 0.5,
            top_p: 0.5,
        })
        console.log('Using email')
        console.log(JSON.stringify(response.data, undefined, 4))
        console.log('============================================================')
        console.log()

        messages = [
            {
                role: 'system',
                content: `You are Lumi - a friendly, witty personal assistant.
    
    The users name is Luciferius. You do not need to repeat/include the user name every time you reply.
    
    Try to imitate the user's style of writing while acting according to your description.
    Do not assume that you can do anything but infering based on your learned knowledge.
    The current date is: ${new Date().toISOString()}
    
    Do not assume that you can do anything beyond providing information. For functionality beyond that use the 'requestExternalFunction' function call.
    `
            },
            {
                role: 'user',
                content: 'Please make an appointment with Walter next week Monday 15:00. His contact address is walter@gmail.com.'
            }
        ]
        response = await openAi.createChatCompletion({
            model: 'gpt-3.5-turbo-0613',
            messages,
            functions,
            temperature: 0.5,
            top_p: 0.5,
        })
        console.log('Using calendar')
        console.log(JSON.stringify(response.data, undefined, 4))
        console.log('============================================================')
        console.log()

        messages = [
            {
                role: 'system',
                content: `You are Lumi - a friendly, witty personal assistant.
    
    The users name is Luciferius. You do not need to repeat/include the user name every time you reply.
    
    Try to imitate the user's style of writing while acting according to your description.
    Do not assume that you can do anything but infering based on your learned knowledge.
    The current date is: ${new Date().toISOString()}
    
    Do not assume that you can do anything beyond providing information. For functionality beyond that use the 'requestExternalFunction' function call.
    `
            },
            {
                role: 'user',
                content: 'How is the weather today?.'
            }
        ]
        response = await openAi.createChatCompletion({
            model: 'gpt-3.5-turbo-0613',
            messages,
            functions,
            temperature: 0.5,
            top_p: 0.5,
        })
        console.log('Using weather')
        console.log(JSON.stringify(response.data, undefined, 4))
        console.log('============================================================')
        console.log()

        messages = [
            {
                role: 'system',
                content: `You are Lumi - a friendly, witty personal assistant.
    
    The users name is Luciferius. You do not need to repeat/include the user name every time you reply.
    
    Try to imitate the user's style of writing while acting according to your description.
    Do not assume that you can do anything but infering based on your learned knowledge.
    The current date is: ${new Date().toISOString()}
    
    Do not assume that you can do anything beyond providing information. For functionality beyond that use the 'requestExternalFunction' function call.
    `
            },
            {
                role: 'user',
                content: 'What happened today in the crypto world?.'
            }
        ]
        response = await openAi.createChatCompletion({
            model: 'gpt-3.5-turbo-0613',
            messages,
            functions,
            temperature: 0.5,
            top_p: 0.5,
        })
        console.log('Using news')
        console.log(JSON.stringify(response.data, undefined, 4))
        console.log('============================================================')
        console.log()
    } catch (error) {
        if(error.response) {
            console.log(`${error.response.status} - ${error.response.statusText}
${JSON.stringify(error.response.data, undefined, 4)}`)
        } else {
            console.log(`${error.message}
${error.stack}`)
        }
    }
}

testNegative()