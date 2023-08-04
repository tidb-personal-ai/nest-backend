import { Controller, Get, Query } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { ChatMessageEntity, Sender } from './chat.database.entity'
import { Between, MoreThanOrEqual, Repository } from 'typeorm'
import { GetKeywordCountRequest, GetKeywordCountResponse, GetMessagesRequest, GetMessagesResponse, ResponseMessage } from './chat.controller.model'
import { InjectAuthUser } from '@user/user.context'
import { User } from '@user/domain/user.model'
import { Admin } from '@auth/auth.decorator'

@Controller('chat')
export class ChatController {
    constructor(
        @InjectRepository(ChatMessageEntity)
        private readonly chatMessageEntity: Repository<ChatMessageEntity>,
    ) {}

    @Get('keyword-count')
    @Admin()
    async getKLeywordCount(
        @Query() payload: GetKeywordCountRequest,
    ): Promise<GetKeywordCountResponse> {
        const count = await this.chatMessageEntity.createQueryBuilder('chat')
            .where('chat.message LIKE :keyword', { keyword: `%${payload.keyword}%` })
            .getCount()
        return { count }
    }

    @Get()
    async getChatMessages(
        @Query() payload: GetMessagesRequest,
        @InjectAuthUser() user: User,
    ): Promise<GetMessagesResponse> {
        const { fromId, toId } = payload
        let idCondition = MoreThanOrEqual(fromId)
        if (toId) {
            idCondition = Between(fromId, toId)
        }
        const messages = await this.chatMessageEntity.find({
            relations: ['user'],
            loadEagerRelations: false,
            loadRelationIds: {
                relations: ['user'],
                disableMixedMap: true,
            },
            where: {
                id: idCondition,
                user: {
                    uid: user.uid,
                },
            },
        })
        return {
            messages: messages.map(
                (message): ResponseMessage => ({
                    message: message.message,
                    timestamp: message.timestamp,
                    id: message.id,
                    sender: message.sender === Sender.User ? 'user' : 'ai',
                }),
            ),
        }
    }
}
