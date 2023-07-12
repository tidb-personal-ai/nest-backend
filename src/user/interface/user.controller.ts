import { UserEntity } from './user.database.entity'
import { QueryRunner } from 'typeorm'
import { InjectAuthUser } from '@user/user.context'
import { Controller, Get, Inject, Post } from '@nestjs/common'
import { DataContext, InjectDataContext, RequestData } from '@shared/data_context'
import { User } from '@user/domain/user.model'
import { EventMap as UserEventMap } from '../domain/user.event'
import * as Emittery from 'emittery'

@Controller('user')
export class UserController {
    constructor(
        @Inject(Emittery)
        private readonly eventBus: Emittery<UserEventMap>,
    ) {}

    @Get()
    @RequestData('user')
    async getUser(@InjectDataContext() dataContext: DataContext): Promise<User> {
        return dataContext.get<User>('user')
    }

    @Post('delete')
    @RequestData('transaction')
    async deleteUser(@InjectAuthUser() user: User, @InjectDataContext() dataContext: DataContext): Promise<void> {
        await dataContext.get<QueryRunner>('transaction').manager.delete(UserEntity, { uid: user.uid })
        await this.eventBus.emit('userDeleted', user)
    }
}
