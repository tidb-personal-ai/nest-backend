import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import * as Emittery from 'emittery'
import { EventMap as AiEventMap } from '@ai/domain/ai.events'
import { UserEntity } from '@user/interface/user.database.entity'

export interface ChatInterface {
    id: string
    send(message: string): void
}

@Injectable()
export class ChatService implements OnModuleInit {
    private readonly clients: Map<string, ChatInterface> = new Map()

    constructor(
        @Inject(Emittery) private readonly eventBus: Emittery<AiEventMap>,
    ) {}

    onModuleInit() {
        this.eventBus.on('aiCreated', (event) =>
            this.handleAiCreated.call(this, event),
        )
    }

    private handleAiCreated(event: AiEventMap['aiCreated']) {
        const user = event.dataContext.get<UserEntity>('user')
        this.clients.get(user.uid)?.send(`Hi. I am ${event.ai.name}.`)
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
}
