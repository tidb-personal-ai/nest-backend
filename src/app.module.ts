import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { JWTModule } from '@auth/jwt.module'
import { ConfigModule } from '@nestjs/config'
import { isDevEnvironment } from './shared/environment'
import { SharedModule } from '@shared/shared.module'
import { AiModule } from '@ai/ai.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigType } from '@nestjs/config'
import appConfig from './app.config'
import { UserModule } from '@user/user.module'
import { ChatModule } from '@chat/chat.module'

@Module({
    imports: [
        JWTModule,
        ConfigModule.forRoot({
            ignoreEnvFile: !isDevEnvironment,
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule.forFeature(appConfig)],
            useFactory: (config: ConfigType<typeof appConfig>) => ({
                type: 'mysql',
                host: config.database.host,
                port: config.database.port,
                username: config.database.user,
                password: config.database.password,
                database: config.database.name,
                autoLoadEntities: true,
                ssl: {
                    minVersion: 'TLSv1.2',
                    rejectUnauthorized: true,
                },
                synchronize: true,
            }),
            inject: [appConfig.KEY],
        }),
        SharedModule,
        AiModule,
        UserModule,
        ChatModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
