import { Body, Controller, Get, Post } from '@nestjs/common'
import {
    AiResponse,
    CreateAiRequest,
    GetAiResponse,
} from './ai.controller.model'
import {
    DataContext,
    InjectDataContext,
    RequestData,
} from '@shared/data_context'
import { AiService } from '@ai/use_cases/ai.service'

@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) {}

    @Get()
    getAi(): GetAiResponse {
        return {
            exists: false,
        }
    }

    @Post('create')
    @RequestData('ai')
    async createAi(
        @Body() payload: CreateAiRequest,
        @InjectDataContext() context: DataContext,
    ): Promise<AiResponse> {
        return await this.aiService.createAi(payload, context)
    }
}
