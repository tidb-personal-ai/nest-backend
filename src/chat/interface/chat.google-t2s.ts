import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { InterceptableEmittery } from '@shared/events.service'
import * as Emittery from 'emittery'
import { AudioSynthesisRequest, EventMap as ChatEventMap } from '../domain/chat.events'
import chatConfig from '../chat.config'
import { ConfigType } from '@nestjs/config'
import { TextToSpeechClient } from '@google-cloud/text-to-speech'

@Injectable()
export class GoogleT2SService implements OnModuleInit {
    private readonly t2sClient: TextToSpeechClient
    constructor(
        @Inject(Emittery)
        private readonly eventBus: InterceptableEmittery<ChatEventMap>,
        @Inject(chatConfig.KEY)
        private readonly config: ConfigType<typeof chatConfig>,
    ) {
        this.t2sClient = new TextToSpeechClient()
    }

    onModuleInit() {
        this.eventBus.on('audioSynthesisRequest', async (event) => {
            await this.handleAudioSynthesisRequest.call(this, event)
        })
    }

    async handleAudioSynthesisRequest(request: AudioSynthesisRequest) {
        const [response] = await this.t2sClient.synthesizeSpeech({
            input: {
                text: request.message.message,
            },
            voice: {
                languageCode: 'en-US',
                name: 'en-US-Neural2-F',
            },
            audioConfig: {
                audioEncoding: 'OGG_OPUS',
            },
        })
        if (typeof response.audioContent === 'object') {
            response.audioContent = Buffer.from(response.audioContent).toString('base64')
        }
        request.reply = {
            audio: response.audioContent as string,
            mime: 'audio/ogg; codecs=opus',
            id: request.message.id,
        }
    }
}
