import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { JWTModule } from '@jwt/jwt.module'
import { ConfigModule } from '@nestjs/config'
import { isDevEnvironment } from './helpers/environment'
import { SharedModule } from '@shared/shared.module'
import { AiModule } from '@ai/ai.module'

@Module({
    imports: [
        JWTModule,
        ConfigModule.forRoot({
            ignoreEnvFile: !isDevEnvironment,
        }),
        SharedModule,
        AiModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
