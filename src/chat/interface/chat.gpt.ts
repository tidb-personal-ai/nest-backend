import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import * as Emittery from 'emittery'
import {
    ChatCompletionRequest,
    EventMap as ChatEventMap,
} from '../domain/chat.events'
import {
    ChatCompletionRequestMessage,
    ChatCompletionRequestMessageRoleEnum,
    Configuration,
    OpenAIApi,
} from 'openai'
import chatConfig from '../chat.config'
import { ConfigType } from '@nestjs/config'
import { ChatMessageType } from '../domain/chat.domain'

@Injectable()
export class GptService implements OnModuleInit {
    private readonly openAi: OpenAIApi

    constructor(
        @Inject(Emittery) private readonly eventBus: Emittery<ChatEventMap>,
        @Inject(chatConfig.KEY)
        private readonly config: ConfigType<typeof chatConfig>,
    ) {
        const openAiConfiguration = new Configuration({
            apiKey: this.config.openAi.apiKey,
        })
        this.openAi = new OpenAIApi(openAiConfiguration)
    }

    onModuleInit() {
        this.eventBus.on(
            'chatCompletionRequest',
            async (event) =>
                await this.handleChatCompletionRequest.call(this, event),
        )
    }

    async handleChatCompletionRequest(request: ChatCompletionRequest) {
        const messages = request.chatSegment.messages.map(
            (message): ChatCompletionRequestMessage => {
                let role: ChatCompletionRequestMessageRoleEnum
                switch (message.type) {
                    case ChatMessageType.User:
                        role = ChatCompletionRequestMessageRoleEnum.User
                        break
                    case ChatMessageType.System:
                        role = ChatCompletionRequestMessageRoleEnum.System
                        break
                    case ChatMessageType.Ai:
                        role = ChatCompletionRequestMessageRoleEnum.Assistant
                        break
                    default:
                        throw new Error(`Unknown message type: ${message.type}`)
                }
                return {
                    role,
                    content: message.message,
                }
            },
        )
        try {
            //TODO ai messages not included in session
            const response = await this.openAi.createChatCompletion({
                model: 'gpt-3.5-turbo',
                messages,
            })
            //TODO handle status code and other errors
            request.reply = {
                message: response.data.choices[0].message?.content,
                timestamp: new Date(),
                type: ChatMessageType.Ai,
            }
        } catch (error) {
            throw error
        }
    }
}
