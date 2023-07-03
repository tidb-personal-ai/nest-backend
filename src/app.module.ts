import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { JWTModule } from '@jwt/jwt.module'

@Module({
    imports: [JWTModule],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
