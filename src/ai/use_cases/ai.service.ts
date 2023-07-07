import { Ai } from '@ai/domain/ai.domain'
import { Inject, Injectable } from '@nestjs/common'
import { AiValidationService } from './ai.validation'
import { DataContext } from '@shared/data_context'
import * as Emittery from 'emittery'
import { EventMap as AiEventMap } from '@ai/domain/ai.events'

@Injectable()
export class AiService {
    constructor(
        private readonly validation: AiValidationService,
        @Inject(Emittery) private readonly eventBus: Emittery<AiEventMap>,
    ) {}

    async createAi(ai: Ai, dataContext: DataContext): Promise<Ai> {
        this.validation.validateAiCreation(ai, dataContext)
        await this.eventBus.emit('aiCreated', { ai, dataContext })
        return ai
    }
}
