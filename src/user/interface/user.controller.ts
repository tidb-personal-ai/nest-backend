import { InjectRepository } from '@nestjs/typeorm'
import { UserEntity } from './user.database.entity'
import { QueryRunner, Repository } from 'typeorm'
import { InjectAuthUser } from '@user/user.context'
import { Controller, Get, Post } from '@nestjs/common'
import {
    DataContext,
    InjectDataContext,
    RequestData,
} from '@shared/data_context'
import { User } from '@user/domain/user.model'

@Controller('user')
export class UserController {
    constructor(
        @InjectRepository(UserEntity)
        private readonly userEntity: Repository<UserEntity>,
    ) {}

    @Get()
    @RequestData('user')
    async getUser(
        @InjectDataContext() dataContext: DataContext,
    ): Promise<User> {
        return dataContext.get<User>('user')
    }

    @Post('delete')
    @RequestData('transaction')
    async deleteUser(
        @InjectAuthUser() user: User,
        @InjectDataContext() dataContext: DataContext,
    ): Promise<void> {
        await dataContext
            .get<QueryRunner>('transaction')
            .manager.delete(UserEntity, { uid: user.uid })
    }
}
