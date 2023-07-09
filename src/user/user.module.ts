import { Module } from '@nestjs/common'
import { UserEntity } from './interface/user.database.entity'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserController } from './interface/user.controller'

@Module({
    imports: [TypeOrmModule.forFeature([UserEntity])],
    exports: [TypeOrmModule],
    controllers: [UserController],
})
export class UserModule {}
