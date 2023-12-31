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
import { ChatMessageEntity, ChatSessionEntity, ChatSummaryEntity } from './interface/chat.database.entity'
import { MilvusClientService } from './interface/chat.milvus'
import { ChatController } from './interface/chat.controller'
import { DeepgramClientService } from './interface/chat.deepgram'
import { GoogleT2SService } from './interface/chat.google-t2s'

@Module({
    imports: [
        UserModule,
        JWTModule,
        ConfigModule.forFeature(chatConfig),
        TypeOrmModule.forFeature([ChatMessageEntity, ChatSessionEntity, ChatSummaryEntity]),
    ],
    providers: [
        ChatGateway,
        ChatService,
        GptService,
        ChatDatabaseService,
        MilvusClientService,
        DeepgramClientService,
        GoogleT2SService,
    ],
    controllers: [ChatController],
})
export class ChatModule {}
