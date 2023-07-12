import { Inject, Injectable, OnModuleInit, Logger } from '@nestjs/common'
import * as Emittery from 'emittery'
import { EventMap as AiEventMap } from '@ai/domain/ai.events'
import {
    ChatCompletionRequest,
    EventMap as ChatEventMap,
    ChatFunctionParameterType,
    SimilarChatSummaryRequest,
} from '../domain/chat.events'
import { User } from '@user/domain/user.model'
import { Ai } from '@ai/domain/ai.domain'
import {
    ChatMessage,
    ChatMessageType,
    ChatSegment,
} from '../domain/chat.domain'
import { DataContext } from '@shared/data_context'
import { InvalidFunctionCall, NoAiResponse } from '@chat/domain/chat.errors'
import * as calculateSimilarity from 'cos-similarity'
import chatConfig from '../chat.config'
import { ConfigType } from '@nestjs/config'

export interface ChatInterface {
    id: string
    send(message: string): void
}

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
        this.eventBus.on('aiCreated', (event) =>
            this.handleAiCreated.call(this, event),
        )
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
        this.clients.get(user.uid)?.send(chatCompletionRequest.reply.message)
    }

    private buildFirstUserMessage() {
        return 'Hi. Please introduce yourself. You do not need to repeat or mention your traits. Afterward ask me some questions to get to know me better. Pretend that you start the conversation.'
    }

    private buildSystemMessage(ai: Ai, user: User, summary?: string) {
        let systemMessage = `You are an ai that tries to bond with the user by being a helpful assistant.

This is your profile:
Name: ${ai.name}
Traits: ${ai.traits.join(', ')}

This is the user's profile:
Name: ${user.name}

In your relies try to act according to your traits and consider the user's profile. Try to imitate the user's style of writing.
`
        if (summary) {
            systemMessage += `

Following is the summary of a similar past conversation. You can use it as a reference.

${summary}`
        }
        return systemMessage
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

    public async getMessageReply(
        message: ChatMessage,
        dataContext: DataContext,
    ): Promise<ChatMessage> {
        await this.eventBus.emit('chatMessageCreated', { message, dataContext })
        const chatSegment = dataContext.get<ChatSegment>('chat-session')
        const similarity: number = calculateSimilarity(
            chatSegment.messages.slice(-1)[0].vector,
            message.vector,
        )
        if (similarity > this.config.similarityThreshold) {
            chatSegment.messages.push(message)
            return await generateResponse.call(this)
        }
        return await changeTopic.call(this)

        async function changeTopic(this: ChatService): Promise<ChatMessage> {
            this.logger.log(
                `Change topic for user ${dataContext.get<User>('user').uid}`,
            )
            this.generateSummary(chatSegment.messages, dataContext)

            const request: SimilarChatSummaryRequest = { message }
            await this.eventBus.emit('similarChatSummaryRequest', request)

            const systemMessage = this.buildSystemMessage(
                dataContext.get<Ai>('ai'),
                dataContext.get<User>('user'),
                request.reply?.summary,
            )

            chatSegment.messages = [
                {
                    message: systemMessage,
                    timestamp: new Date(),
                    type: ChatMessageType.System,
                },
                message,
            ]
            return await generateResponse.call(this)
        }

        async function generateResponse(
            this: ChatService,
        ): Promise<ChatMessage> {
            const chatCompletionRequest: ChatCompletionRequest = {
                chatSegment,
            }
            await this.eventBus.emit(
                'chatCompletionRequest',
                chatCompletionRequest,
            )
            if (chatCompletionRequest.reply) {
                return await processChatReply.call(this)
            }
            if (chatCompletionRequest.functionCall) {
                return await processChatFunctionCall()
            }
            throw new NoAiResponse()

            async function processChatReply(
                this: ChatService,
            ): Promise<ChatMessage> {
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

            async function processChatFunctionCall(): Promise<ChatMessage> {
                throw new InvalidFunctionCall(
                    chatCompletionRequest.functionCall.name,
                    chatCompletionRequest.functionCall,
                )
            }
        }
    }

    private async generateSummary(
        chatSegment: ChatMessage[],
        dataContext: DataContext,
    ) {
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
                                description:
                                    'Tags that describe the content of the chat. Format: tag1, tag2, tag3',
                                type: ChatFunctionParameterType.String,
                                required: true,
                            },
                        ],
                    },
                ],
            }
            await this.eventBus.emit(
                'chatCompletionRequest',
                chatCompletionRequest,
            )

            if (!chatCompletionRequest.functionCall) {
                const ids = chatSegment.filter((m) => m.id).map((m) => m.id)
                this.logger.error(
                    `Summary generation failed for messages ${Math.min(
                        ...ids,
                    )} - ${Math.max(...ids)}`,
                )
            }
            await this.eventBus.emit('chatSummaryCreated', {
                chatSummary: {
                    summary: chatCompletionRequest.functionCall.parameters.find(
                        (p) => p.name === 'summary',
                    )?.value,
                    tags: chatCompletionRequest.functionCall.parameters
                        .find((p) => p.name === 'tags')
                        ?.value.split(',')
                        .map((t) => t.trim()),
                    messages: chatSegment,
                },
                dataContext,
            })
        } catch (e) {
            this.logger.error(
                `Summary generation failed: ${e.message}`,
                e.stack,
            )
        }
    }
}
