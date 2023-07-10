import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import {
    ChatMessageEntity,
    ChatSessionEntity,
    Sender,
} from './chat.database.entity'
import { QueryRunner, Repository } from 'typeorm'
import * as Emittery from 'emittery'
import { EventMap as ChatEvents } from '@chat/domain/chat.events'
import { InjectRepository } from '@nestjs/typeorm'
import { ChatMessageType } from '@chat/domain/chat.domain'

@Injectable()
export class ChatDatabaseService implements OnModuleInit {
    constructor(
        @Inject(Emittery) private readonly eventBus: Emittery<ChatEvents>,
        @InjectRepository(ChatMessageEntity)
        private readonly chatMessageEntity: Repository<ChatMessageEntity>,
        @InjectRepository(ChatSessionEntity)
        private readonly chatSessionEntity: Repository<ChatSessionEntity>,
    ) {}

    onModuleInit() {
        this.eventBus.on('chatMessageCreated', async (event) => {
            await this.handleChatMessageCreated.call(this, event)
        })
        this.eventBus.on('chatSegmentUpdated', async (event) => {
            await this.handleChatSegmentUpdated.call(this, event)
        })
    }

    async handleChatSegmentUpdated(event: ChatEvents['chatSegmentUpdated']) {
        let chatSession =
            event.dataContext.get<ChatSessionEntity>('chat-session')
        if (chatSession) {
            chatSession.messages = event.chatSegment.messages
        } else {
            chatSession = this.chatSessionEntity.create({
                messages: event.chatSegment.messages,
                user: event.dataContext.get('user'),
            })
        }
        const transaction = event.dataContext.get<QueryRunner>('transaction')
        if (transaction.isTransactionActive) {
            await transaction.manager.save(chatSession)
        } else {
            this.chatSessionEntity.save(chatSession)
        }
    }

    async handleChatMessageCreated(event: ChatEvents['chatMessageCreated']) {
        let sender: Sender | undefined = undefined
        switch (event.message.type) {
            case ChatMessageType.User:
                sender = Sender.User
                break
            case ChatMessageType.Ai:
                sender = Sender.Ai
                break
            default:
                return
        }

        const chatMessage = this.chatMessageEntity.create({
            message: event.message.message,
            timestamp: event.message.timestamp,
            sender: sender,
            user: event.dataContext.get('user'),
        })
        const transaction = event.dataContext.get<QueryRunner>('transaction')
        if (transaction.isTransactionActive) {
            await transaction.manager.save(chatMessage)
        } else {
            this.chatMessageEntity.save(chatMessage)
        }
    }
}
