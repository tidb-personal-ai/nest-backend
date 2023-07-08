import { Module } from '@nestjs/common'
import { UserModule } from '@user/user.module'
import { ChatGateway } from './interface/chat.gateway'
import { JWTModule } from '@jwt/jwt.module'
import { ChatService } from './use_cases/chat.service'

@Module({
    imports: [UserModule, JWTModule],
    providers: [ChatGateway, ChatService],
})
export class ChatModule {}
