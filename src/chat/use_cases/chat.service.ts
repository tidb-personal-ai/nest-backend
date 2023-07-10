import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import * as Emittery from 'emittery'
import { EventMap as AiEventMap } from '@ai/domain/ai.events'
import {
    ChatCompletionRequest,
    EventMap as ChatEventMap,
} from '../domain/chat.events'
import { User } from '@user/domain/user.model'
import { Ai } from '@ai/domain/ai.domain'
import {
    ChatMessage,
    ChatMessageType,
    ChatSegment,
} from '../domain/chat.domain'
import { DataContext } from '@shared/data_context'

export interface ChatInterface {
    id: string
    send(message: string): void
}

@Injectable()
export class ChatService implements OnModuleInit {
    private readonly clients: Map<string, ChatInterface> = new Map()

    constructor(
        @Inject(Emittery)
        private readonly eventBus: Emittery<AiEventMap & ChatEventMap>,
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

    private buildSystemMessage(ai: Ai, user: User) {
        return `You are an ai that tries to bond with the user by being a helpful assistant.

This is your profile:
Name: ${ai.name}
Traits: ${ai.traits.join(', ')}

This is the user's profile:
Name: ${user.name}

In your relies try to act according to your traits and consider the user's profile.
`
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
    ) {
        await this.eventBus.emit('chatMessageCreated', { message, dataContext })
        const chatSegment = dataContext.get<ChatSegment>('chat-session')
        chatSegment.messages.push(message)
        const chatCompletionRequest: ChatCompletionRequest = { chatSegment }
        await this.eventBus.emit('chatCompletionRequest', chatCompletionRequest)
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
}
