import { Module } from '@nestjs/common'
import { AiController } from './interface/ai.controller'
import { AiService } from './use_cases/ai.service'
import { AiValidationService } from './use_cases/ai.validation'

@Module({
    controllers: [AiController],
    providers: [AiService, AiValidationService],
})
export class AiModule {}
