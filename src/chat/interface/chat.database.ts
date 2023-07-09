import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ChatMessageEntity, Sender } from './chat.database.entity'
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
    ) {}

    onModuleInit() {
        this.eventBus.on('chatMessageCreated', async (event) => {
            await this.handleChatMessageCreated.call(this, event)
        })
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
            message: event.message.text,
            timestamp: event.message.timestamp,
            sender: sender,
            user: event.dataContext.get('user'),
        })
        await event.dataContext
            .get<QueryRunner>('transaction')
            .manager.save(chatMessage)
    }
}
