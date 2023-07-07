import { Ai } from '@ai/domain/ai.domain'
import { AiExists } from '@ai/domain/ai.errors'
import { Injectable } from '@nestjs/common'
import { DataContext } from '@shared/data_context'

@Injectable()
export class AiValidationService {
    validateAiCreation(ai: Ai, dataContext: DataContext) {
        if (dataContext.has('ai')) {
            throw new AiExists()
        }
    }
}
