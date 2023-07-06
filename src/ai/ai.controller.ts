import { Body, Controller, Get, Post } from '@nestjs/common'
import { AiResponse, CreateAiRequest, GetAiResponse } from './ai.model'

@Controller('ai')
export class AiController {
    @Get()
    getAi(): GetAiResponse {
        return {
            exists: false,
        }
    }

    @Post('create')
    createAi(@Body() payload: CreateAiRequest): AiResponse {
        return {
            name: payload.name,
            traits: payload.traits,
        }
    }
}
