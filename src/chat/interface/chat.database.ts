import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ChatMessageEntity, ChatSessionEntity, ChatSummaryEntity, Sender } from './chat.database.entity'
import { In, QueryRunner, Repository } from 'typeorm'
import * as Emittery from 'emittery'
import { EventMap as ChatEvents } from '@chat/domain/chat.events'
import { InjectRepository } from '@nestjs/typeorm'
import { ChatMessageType, ChatSummary } from '@chat/domain/chat.domain'
import { UserEntity } from '@user/interface/user.database.entity'
import { InterceptableEmittery } from '@shared/events.service'

@Injectable()
export class ChatDatabaseService implements OnModuleInit {
    constructor(
        @Inject(Emittery) private readonly eventBus: InterceptableEmittery<ChatEvents>,
        @InjectRepository(ChatMessageEntity)
        private readonly chatMessageEntity: Repository<ChatMessageEntity>,
        @InjectRepository(ChatSessionEntity)
        private readonly chatSessionEntity: Repository<ChatSessionEntity>,
        @InjectRepository(ChatSummaryEntity)
        private readonly chatSummaryEntitiy: Repository<ChatSummaryEntity>,
    ) {}

    onModuleInit() {
        this.eventBus.on('chatMessageCreated', async (event) => {
            await this.handleChatMessageCreated.call(this, event)
        })
        this.eventBus.on('chatSegmentUpdated', async (event) => {
            await this.handleChatSegmentUpdated.call(this, event)
        })
        this.eventBus.on('chatSummaryCreated', async (event) => {
            await this.handleChatSummaryCreated.call(this, event)
        })
        this.eventBus.onAfter('similarChatSummaryRequest', async (event) => {
            await this.handleSimilarSummaryRequest.call(this, event)
        })
    }

    async handleSimilarSummaryRequest(event: ChatEvents['similarChatSummaryRequest']) {
        const summary = await this.chatSummaryEntitiy.findOneBy({ id: event.summaryId })
        event.reply = summary as unknown as ChatSummary
    }

    async handleChatSummaryCreated(event: ChatEvents['chatSummaryCreated']) {
        const user = event.dataContext.get<UserEntity>('user')
        const ids = event.chatSummary.messages.filter((m) => m.id).map((m) => m.id)
        const messages = await this.chatMessageEntity.findBy({ id: In(ids) })
        const chatSummary = this.chatSummaryEntitiy.create({
            summary: event.chatSummary.summary,
            tags: event.chatSummary.tags,
            messages: messages,
            user: user,
        })
        const result = await this.chatSummaryEntitiy.save(chatSummary)
        event.chatSummary.id = result.id
    }

    async handleChatSegmentUpdated(event: ChatEvents['chatSegmentUpdated']) {
        let chatSession = event.dataContext.get<ChatSessionEntity>('chat-session')
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
            isFunctionCall: event.message.isFunctionCall !== undefined ? event.message.isFunctionCall : false,
            user: event.dataContext.get('user'),
        })
        const transaction = event.dataContext.get<QueryRunner>('transaction')
        let result: ChatMessageEntity
        if (transaction.isTransactionActive) {
            result = await transaction.manager.save(chatMessage)
        } else {
            result = await this.chatMessageEntity.save(chatMessage)
        }
        event.message.id = result.id
    }
}
