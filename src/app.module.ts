import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { JWTModule } from '@jwt/jwt.module'
import { ConfigModule } from '@nestjs/config'

@Module({
    imports: [JWTModule, ConfigModule.forRoot()],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
