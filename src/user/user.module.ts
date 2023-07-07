import { Module } from '@nestjs/common'
import { UserEntity } from './interface/user.database.entity'
import { TypeOrmModule } from '@nestjs/typeorm'

@Module({
    imports: [TypeOrmModule.forFeature([UserEntity])],
    exports: [TypeOrmModule],
})
export class UserModule {}
