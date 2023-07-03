import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { FirebaseAuthGuard } from './jwt.guard'
import { FirebaseAuthService } from './jwt.service'

@Module({
    providers: [
        {
            provide: APP_GUARD,
            useClass: FirebaseAuthGuard,
        },
        FirebaseAuthService,
    ],
})
export class JWTModule {}
