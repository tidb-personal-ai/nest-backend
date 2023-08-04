import { Inject, Injectable, OnModuleInit, Logger } from '@nestjs/common'
import * as Emittery from 'emittery'
import { EventMap as AiEventMap } from '@ai/domain/ai.events'
import {
    AudioSynthesisRequest,
    AudioTranscriptionRequest,
    ChatCompletionRequest,
    EventMap as ChatEventMap,
    ChatFunction,
    ChatFunctionParameterType,
    SimilarChatSummaryRequest,
} from '../domain/chat.events'
import { User } from '@user/domain/user.model'
import { Ai } from '@ai/domain/ai.domain'
import { ChatMessage, ChatMessageType, ChatSegment, ChatSummary } from '../domain/chat.domain'
import { DataContext } from '@shared/data_context'
import { InvalidFunctionCall, NoAiResponse } from '@chat/domain/chat.errors'
import * as calculateSimilarity from 'cos-similarity'
import chatConfig from '../chat.config'
import { ConfigType } from '@nestjs/config'
import { encode } from 'gpt-3-encoder'

export interface ChatInterface {
    id: string
    send(message: ChatInterfaceMessage): void
}

export type ChatInterfaceMessage = {
    message: string
    timestamp: Date
    id: number
    sender?: ChatInterfaceSender
}

export type ChatInterfaceSender = 'user' | 'ai'

@Injectable()
export class ChatService implements OnModuleInit {
    private readonly clients: Map<string, ChatInterface> = new Map()
    private readonly logger: Logger = new Logger('ChatService')

    constructor(
        @Inject(Emittery)
        private readonly eventBus: Emittery<AiEventMap & ChatEventMap>,
        @Inject(chatConfig.KEY)
        private readonly config: ConfigType<typeof chatConfig>,
    ) {}

    onModuleInit() {
        this.eventBus.on('aiCreated', (event) => this.handleAiCreated.call(this, event))
    }

    private async handleAiCreated(event: AiEventMap['aiCreated']) {
        const user = event.dataContext.get<User>('user')
        const chatSegment: ChatSegment = {
            userId: user.uid,
            messages: [
                {
                    message: this.buildSystemMessage(event.ai, user),
                    timestamp: new Date(),
                    type: ChatMessageType.System,
                },
                {
                    message: this.buildFirstUserMessage(),
                    timestamp: new Date(),
                    type: ChatMessageType.User,
                },
            ],
        }
        const chatCompletionRequest: ChatCompletionRequest = { chatSegment }
        await this.eventBus.emit('chatCompletionRequest', chatCompletionRequest)
        await this.eventBus.emit('chatMessageCreated', {
            message: chatCompletionRequest.reply,
            dataContext: event.dataContext,
        })
        chatSegment.messages.push(chatCompletionRequest.reply)
        await this.eventBus.emit('chatSegmentUpdated', {
            chatSegment,
            dataContext: event.dataContext,
        })
        this.clients.get(user.uid)?.send({
            message: chatCompletionRequest.reply.message,
            timestamp: chatCompletionRequest.reply.timestamp,
            id: chatCompletionRequest.reply.id,
        })
    }

    private buildFirstUserMessage() {
        return 'Please introduce yourself. You do not need to repeat or mention your traits. Afterward ask me some questions to get to know me better. Pretend that you start the conversation.'
    }

    private buildSystemMessage(ai: Ai, user: User) {
        return `You are ${ai.name} - a ${ai.traits.join(', ')} personal assistant.

The users name is ${user.name}. You do not need to repeat/include the user name every time you reply.

Try to imitate the user's style of writing while acting according to your description.
Do not assume that you can do anything but infering based on your learned knowledge.
The current date is: ${new Date().toISOString()}
`
    }

    private buildChatFunctions(): ChatFunction[] {
        return [
            {
                name: 'requestExternalFunction',
                description: 'Request the execution of a functionality that goes beyond the capabilities of a language model.',
                parameters: [
                    {
                        name: 'functionDomain',
                        type: ChatFunctionParameterType.Enum,
                        description: "The general category or domain of the requested function. Can be 'email' for managing emails, 'calendar' for managing calendar events, 'weather' to retrieve information about the weather, 'news' to get the latest news on any topic.",
                        required: true,
                        enumValues: ['email', 'calendar', 'weather', 'news'],
                    }
                ]
            },
            {
                name: 'remember',
                description: 'Retrieve information about past conversations with the user.',
                parameters: [
                    {
                        name: 'topic',
                        type: ChatFunctionParameterType.String,
                        description: 'The information that is requested by the user.',
                        required: true,
                    }
                ]
            }
        ]
    }

    public onChatOpened(userId: string, chat: ChatInterface) {
        this.clients.set(userId, chat)
    }

    public onChatClosed(chatId: string) {
        this.clients.forEach((chat, id) => {
            if (id === chatId) {
                this.clients.delete(id)
            }
        })
    }

    public async getMessageAcknowledged(message: ChatMessage, dataContext: DataContext) {
        await this.eventBus.emit('chatMessageCreated', { message, dataContext })
        return message
    }

    public async getAudioMessageAcknowledged(audioData: string, dataContext: DataContext) {
        const audioMessageRequest: AudioTranscriptionRequest = {
            audio: audioData,
        }
        await this.eventBus.emit('audioTranscriptionRequest', audioMessageRequest)
        return this.getMessageAcknowledged(audioMessageRequest.reply, dataContext)
    }

    public async getAudioMessageResponse(message: ChatMessage) {
        const audioSynthesisRequest: AudioSynthesisRequest = {
            message,
        }
        await this.eventBus.emit('audioSynthesisRequest', audioSynthesisRequest)
        return audioSynthesisRequest.reply
    }

    public async getMessageReply(message: ChatMessage, dataContext: DataContext): Promise<ChatMessage> {
        const chatSegment = dataContext.get<ChatSegment>('chat-session')
        const similarity: number = calculateSimilarity(chatSegment.messages.slice(-1)[0].vector, message.vector)
        if (this.calculateTokens([...chatSegment.messages, message]) > this.config.maxTokens) {
            return await summarizeTopic.call(this)
        } else if (similarity > this.config.similarityThreshold) {
            chatSegment.messages.push(message)
            return await generateResponse.call(this)
        }
        return await changeTopic.call(this)

        async function summarizeTopic(this: ChatService): Promise<ChatMessage> {
            this.logger.log(`Summarize topic for user ${dataContext.get<User>('user').uid}`)
            const summary = await this.generateSummary(chatSegment.messages, dataContext)

            const systemMessage = this.buildSystemMessage(dataContext.get<Ai>('ai'), dataContext.get<User>('user'))

            //TODO otimize my having the summary as a ai message
            chatSegment.messages = [
                {
                    message: systemMessage,
                    timestamp: new Date(),
                    type: ChatMessageType.System,
                },
                {
                    message: `Here is the summary of our conversation so far:
${summary.summary}`,
                    timestamp: new Date(),
                    type: ChatMessageType.Ai,
                },
                message,
            ]
            return await generateResponse.call(this)
        }

        async function changeTopic(this: ChatService): Promise<ChatMessage> {
            this.logger.log(`Change topic for user ${dataContext.get<User>('user').uid}`)
            this.generateSummary(chatSegment.messages, dataContext)

            const request: SimilarChatSummaryRequest = { message, dataContext }
            await this.eventBus.emit('similarChatSummaryRequest', request)

            const systemMessage = this.buildSystemMessage(dataContext.get<Ai>('ai'), dataContext.get<User>('user'))

            //TODO otimize my having the summary as a ai message
            chatSegment.messages = [
                {
                    message: systemMessage,
                    timestamp: new Date(),
                    type: ChatMessageType.System,
                },
            ]
            if (request.reply) {
                chatSegment.messages.push({
                    message: `Here is what I remember about a conversation we had in the past about a similar topic:
${request.reply.summary}`,
                    timestamp: new Date(),
                    type: ChatMessageType.Ai,
                })
            }
            chatSegment.messages.push(message)
            return await generateResponse.call(this)
        }

        async function generateResponse(this: ChatService): Promise<ChatMessage> {
            const processChatReply = async (): Promise<ChatMessage> => {
                await this.eventBus.emit('chatMessageCreated', {
                    message: chatCompletionRequest.reply,
                    dataContext,
                })
                chatSegment.messages.push(chatCompletionRequest.reply)
                await this.eventBus.emit('chatSegmentUpdated', {
                    chatSegment,
                    dataContext,
                })
                return chatCompletionRequest.reply
            }

            const processRemember = async (): Promise<ChatMessage> => {
                const rememberTopic = chatCompletionRequest.functionCall.parameters.find(p => p.name.toLowerCase() === 'topic')
                if (!rememberTopic) {
                    throw new InvalidFunctionCall(
                        chatCompletionRequest.functionCall.name,
                        chatCompletionRequest.functionCall,
                    )
                }
                //Ignore remember topic for now to use already vectorized message
                const localBestMatch = chatSegment.messages.slice(1,chatSegment.messages.indexOf(message))
                    .map((m) : {
                        distance: number,
                        message: ChatMessage
                    } => {
                        return {
                            distance: calculateSimilarity(message.vector, m.vector),
                            message: m
                        }
                    })
                    .sort((a, b) => b.distance - a.distance)[0]

                const request: SimilarChatSummaryRequest = { message, dataContext }
                await this.eventBus.emit('similarChatSummaryRequest', request)

                const functionResult = {
                    contextBestMatch: localBestMatch?.distance > this.config.similarityThreshold ? localBestMatch.message.message : 'Not found',
                    memoryBestMatch: request.reply ? request.reply.summary : 'Not found',
                }

                chatSegment.messages.push({
                    message: JSON.stringify(functionResult, undefined, 4),
                    timestamp: new Date(),
                    type: ChatMessageType.Function,
                    functionName: chatCompletionRequest.functionCall.name.toLowerCase()
                })
                return await generateResponse.call(this)
            }

            const processChatFunctionCall = async (): Promise<ChatMessage> => {
                switch (chatCompletionRequest.functionCall.name.toLowerCase()) {
                    case 'requestexternalfunction':
                        const requestedFunction = chatCompletionRequest.functionCall.parameters.find(p => p.name.toLowerCase() === 'functiondomain')
                        if (!requestedFunction) {
                            throw new InvalidFunctionCall(
                                chatCompletionRequest.functionCall.name,
                                chatCompletionRequest.functionCall,
                            )
                        }
                        chatSegment.messages.push({
                            message: `{
    "error": "The functioniality ${requestedFunction} is not yet implemented.
}`,
                            timestamp: new Date(),
                            type: ChatMessageType.Function,
                            functionName: chatCompletionRequest.functionCall.name.toLowerCase()
                        })
                        return await generateResponse.call(this)
                    case 'remember':
                        return await processRemember()              
                    default:
                        throw new InvalidFunctionCall(
                            chatCompletionRequest.functionCall.name,
                            chatCompletionRequest.functionCall,
                        )
                }
            }

            const chatCompletionRequest: ChatCompletionRequest = {
                chatSegment,
                chatFunctions: this.buildChatFunctions()
            }
            await this.eventBus.emit('chatCompletionRequest', chatCompletionRequest)
            if (chatCompletionRequest.functionCall) {
                return await processChatFunctionCall()
            }
            if (chatCompletionRequest.reply) {
                return await processChatReply()
            }
            throw new NoAiResponse()
        }
    }

    private calculateTokens(messages: ChatMessage[]) {
        return encode(messages.map((m) => m.message).join(' ')).length
    }

    private async generateSummary(chatSegment: ChatMessage[], dataContext: DataContext) {
        try {
            const chatCompletionRequest: ChatCompletionRequest = {
                chatSegment: {
                    messages: [
                        ...chatSegment,
                        {
                            message: 'Summarize the chat',
                            timestamp: new Date(),
                            type: ChatMessageType.User,
                        },
                    ],
                    userId: dataContext.get<User>('user').uid,
                },
                chatFunctions: [
                    {
                        name: 'generateSummary',
                        description: 'Generate a summary of the chat',
                        force: true,
                        parameters: [
                            {
                                name: 'summary',
                                type: ChatFunctionParameterType.String,
                                description: 'The summary of the chat',
                                required: true,
                            },
                            {
                                name: 'tags',
                                description: 'Tags that describe the content of the chat. Format: tag1, tag2, tag3',
                                type: ChatFunctionParameterType.String,
                                required: true,
                            },
                        ],
                    },
                ],
            }
            await this.eventBus.emit('chatCompletionRequest', chatCompletionRequest)

            if (!chatCompletionRequest.functionCall) {
                const ids = chatSegment.filter((m) => m.id).map((m) => m.id)
                this.logger.error(`Summary generation failed for messages ${Math.min(...ids)} - ${Math.max(...ids)}`)
            }
            const chatSummary: ChatSummary = {
                summary: chatCompletionRequest.functionCall.parameters.find((p) => p.name === 'summary')?.value,
                tags: chatCompletionRequest.functionCall.parameters
                    .find((p) => p.name === 'tags')
                    ?.value.split(',')
                    .map((t) => t.trim()),
                messages: chatSegment,
            }
            await this.eventBus.emit('chatSummaryCreated', {
                chatSummary,
                dataContext,
            })
            return chatSummary
        } catch (e) {
            this.logger.error(`Summary generation failed: ${e.message}`, e.stack)
        }
    }
}
