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
    async deleteUser(@InjectAuthUser() user: User): Promise<void> {
        await this.eventBus.emit('userDeleted', user)
    }
}
