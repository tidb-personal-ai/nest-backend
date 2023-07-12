import { Body, Controller, Get, Post } from '@nestjs/common'
import { AiResponse, CreateAiRequest, GetAiResponse } from './ai.controller.model'
import { DataContext, InjectDataContext, RequestData } from '@shared/data_context'
import { AiService } from '@ai/use_cases/ai.service'
import { Ai } from '@ai/domain/ai.domain'

@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) {}

    @Get()
    @RequestData('ai', 'user')
    getAi(@InjectDataContext() context: DataContext): GetAiResponse {
        const ai = context.get<Ai>('ai')
        return {
            exists: ai !== null,
            ai,
        }
    }

    @Post('create')
    @RequestData('ai', 'user', 'transaction')
    async createAi(@Body() payload: CreateAiRequest, @InjectDataContext() context: DataContext): Promise<AiResponse> {
        return await this.aiService.createAi(payload, context)
    }
}
