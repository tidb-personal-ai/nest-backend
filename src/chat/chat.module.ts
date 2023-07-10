import { Module } from '@nestjs/common'
import { UserModule } from '@user/user.module'
import { ChatGateway } from './interface/chat.gateway'
import { JWTModule } from '@auth/jwt.module'
import { ChatService } from './use_cases/chat.service'
import { GptService } from './interface/chat.gpt'
import { ConfigModule } from '@nestjs/config'
import chatConfig from './chat.config'
import { ChatDatabaseService } from './interface/chat.database'
import { TypeOrmModule } from '@nestjs/typeorm'
import {
    ChatMessageEntity,
    ChatSessionEntity,
} from './interface/chat.database.entity'

@Module({
    imports: [
        UserModule,
        JWTModule,
        ConfigModule.forFeature(chatConfig),
        TypeOrmModule.forFeature([ChatMessageEntity, ChatSessionEntity]),
    ],
    providers: [ChatGateway, ChatService, GptService, ChatDatabaseService],
})
export class ChatModule {}
