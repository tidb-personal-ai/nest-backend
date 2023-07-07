import { Module } from '@nestjs/common'
import { AiController } from './interface/ai.controller'
import { AiService } from './use_cases/ai.service'
import { AiValidationService } from './use_cases/ai.validation'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AiEntity } from './interface/ai.database.entities'
import { UserModule } from '@user/user.module'
import { AiCreatorService } from './interface/ai.database'

@Module({
    imports: [TypeOrmModule.forFeature([AiEntity]), UserModule],
    controllers: [AiController],
    providers: [AiService, AiValidationService, AiCreatorService],
})
export class AiModule {}
