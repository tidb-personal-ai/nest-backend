import { Module } from '@nestjs/common'
import { UserModule } from '@user/user.module'
import { ChatGateway } from './interface/chat.gateway'
import { JWTModule } from '@jwt/jwt.module'
import { ChatService } from './use_cases/chat.service'
import { GptService } from './interface/chat.gpt'
import { ConfigModule } from '@nestjs/config'
import chatConfig from './chat.config'

@Module({
    imports: [UserModule, JWTModule, ConfigModule.forFeature(chatConfig)],
    providers: [ChatGateway, ChatService, GptService],
})
export class ChatModule {}
