import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import * as Emittery from 'emittery'
import {
    ChatCompletionRequest,
    EventMap as ChatEventMap,
    ChatFunctionCall,
    ChatFunctionCallParameter,
    ChatMessageCreated,
} from '../domain/chat.events'
import {
    ChatCompletionRequestMessage,
    ChatCompletionRequestMessageRoleEnum,
    Configuration,
    OpenAIApi,
    ChatCompletionFunctions,
    ChatCompletionRequestMessageFunctionCall,
} from 'openai'
import chatConfig from '../chat.config'
import { ConfigType } from '@nestjs/config'
import { ChatMessageType } from '../domain/chat.domain'
import { InvalidFunctionCall } from '@chat/domain/chat.errors'
import { InterceptableEmittery } from '@shared/events.service'

@Injectable()
export class GptService implements OnModuleInit {
    private readonly openAi: OpenAIApi

    constructor(
        @Inject(Emittery)
        private readonly eventBus: InterceptableEmittery<ChatEventMap>,
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
        this.eventBus.onBefore(
            'chatMessageCreated',
            async (event) =>
                await this.handleBeforeChatMessageCreated.call(this, event),
        )
    }

    async handleBeforeChatMessageCreated(request: ChatMessageCreated) {
        request.message.vector = await this.openAi
            .createEmbedding({
                input: request.message.message,
                model: 'text-embedding-ada-002',
            })
            .then((resp) => resp.data.data[0].embedding)
    }

    async handleChatCompletionRequest(request: ChatCompletionRequest) {
        const messages = convertMessages()
        const functions = convertFunctions()
        const forcedFunction = request.chatFunctions?.find((f) => f.force).name
        try {
            const response = await this.openAi.createChatCompletion({
                model: 'gpt-3.5-turbo-0613',
                messages,
                functions,
                function_call: forcedFunction
                    ? {
                          name: forcedFunction,
                      }
                    : undefined,
            })
            //TODO handle status code and other errors
            const message = response.data.choices[0].message
            if (message) {
                if (message.function_call) {
                    request.functionCall = convertFunctionCall(
                        message.function_call,
                    )
                } else {
                    request.reply = {
                        message: message.content,
                        timestamp: new Date(),
                        type: ChatMessageType.Ai,
                    }
                }
            }
        } catch (error) {
            throw error
        }

        function convertFunctionCall(
            functionCall: ChatCompletionRequestMessageFunctionCall,
        ): ChatFunctionCall {
            const func = request.chatFunctions?.find(
                (func) => func.name === functionCall.name,
            )
            if (!func) {
                throw new InvalidFunctionCall(functionCall.name, functionCall)
            }
            if (!hasAllRequiredParemeter()) {
                throw new InvalidFunctionCall(functionCall.name, functionCall)
            }
            const parameters = functionCall.arguments
                ? func.parameters
                      .filter((p) => functionCall.arguments[p.name])
                      .map((p): ChatFunctionCallParameter => {
                          return {
                              name: p.name,
                              value: functionCall.arguments[p.name],
                          }
                      })
                : []
            return {
                name: functionCall.name,
                parameters,
                originalMessage: functionCall,
            }

            function hasAllRequiredParemeter() {
                if (typeof functionCall.arguments === 'string') {
                    functionCall.arguments = JSON.parse(functionCall.arguments)
                }
                return (
                    func.parameters?.filter(
                        (p) =>
                            p.required &&
                            (!functionCall.arguments ||
                                !functionCall.arguments[p.name]),
                    ).length == 0
                )
            }
        }

        function convertFunctions() {
            return request.chatFunctions?.map(
                (func): ChatCompletionFunctions => {
                    return {
                        name: func.name,
                        description: func.description,
                        parameters: {
                            type: 'object',
                            properties: Object.fromEntries(
                                func.parameters.map((param) => {
                                    return [
                                        param.name,
                                        {
                                            type: param.type.toString(),
                                            description: param.description,
                                        },
                                    ]
                                }),
                            ),
                            required: func.parameters
                                .filter((param) => param.required)
                                .map((param) => param.name),
                        },
                    }
                },
            )
        }

        function convertMessages() {
            return request.chatSegment.messages.map(
                (message): ChatCompletionRequestMessage => {
                    let role: ChatCompletionRequestMessageRoleEnum
                    let content = message.message
                    switch (message.type) {
                        case ChatMessageType.User:
                            role = ChatCompletionRequestMessageRoleEnum.User
                            break
                        case ChatMessageType.System:
                            role = ChatCompletionRequestMessageRoleEnum.System
                            content +=
                                '\nOnly use the functions you have been provided with.'
                            break
                        case ChatMessageType.Ai:
                            role =
                                ChatCompletionRequestMessageRoleEnum.Assistant
                            break
                        default:
                            throw new Error(
                                `Unknown message type: ${message.type}`,
                            )
                    }
                    return {
                        role,
                        content,
                    }
                },
            )
        }
    }
}
