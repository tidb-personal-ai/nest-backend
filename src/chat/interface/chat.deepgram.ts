import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { InterceptableEmittery } from '@shared/events.service'
import * as Emittery from 'emittery'
import { AudioTranscriptionRequest, EventMap as ChatEventMap } from '../domain/chat.events'
import chatConfig from '../chat.config'
import { ConfigType } from '@nestjs/config'
import { Deepgram } from '@deepgram/sdk'
import { ChatMessageType } from '@chat/domain/chat.domain'

@Injectable()
export class DeepgramClientService implements OnModuleInit {
    private readonly deepgramService: Deepgram

    constructor(
        @Inject(Emittery)
        private readonly eventBus: InterceptableEmittery<ChatEventMap>,
        @Inject(chatConfig.KEY)
        private readonly config: ConfigType<typeof chatConfig>,
    ) {
        this.deepgramService = new Deepgram(this.config.deepgram.apiKey)
    }

    onModuleInit() {
        this.eventBus.on('audioTranscriptionRequest', async (event) => {
            await this.handleAudioTranscriptionRequest.call(this, event)
        })
    }

    async handleAudioTranscriptionRequest(request: AudioTranscriptionRequest) {
        const message = await this.deepgramService.transcription.preRecorded(
            {
                buffer: Buffer.from(request.audio, 'base64'),
                mimetype: 'audio/opus',
            },
            {
                smart_formatting: true,
                punctuate: true,
                paragraphs: true,
            },
        )
        if (message.err_code || !message.results) {
            throw new Error(`${message.err_code}: ${message.err_msg}`)
        }
        request.reply = {
            type: ChatMessageType.User,
            message: message.results.channels[0].alternatives[0].transcript,
            timestamp: new Date(),
        }
    }
}
