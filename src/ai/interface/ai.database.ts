import { EventMap as AiEvents } from '@ai/domain/ai.events'
import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import * as Emittery from 'emittery'
import { AiEntity } from './ai.database.entities'
import { QueryRunner, Repository } from 'typeorm'

@Injectable()
export class AiCreatorService implements OnModuleInit {
    constructor(
        @Inject(Emittery) private readonly eventBus: Emittery<AiEvents>,
        @InjectRepository(AiEntity)
        private readonly aiRepository: Repository<AiEntity>,
    ) {}

    onModuleInit() {
        this.eventBus.on('aiCreated', async (event) => {
            await this.handleAiCreated.call(this, event)
        })
    }

    private async handleAiCreated(event: AiEvents['aiCreated']) {
        const ai = this.aiRepository.create({
            name: event.ai.name,
            traits: event.ai.traits,
            user: event.dataContext.get('user'),
        })
        await event.dataContext.get<QueryRunner>('transaction').manager.save(ai)
    }
}
