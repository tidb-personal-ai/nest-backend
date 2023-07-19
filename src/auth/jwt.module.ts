import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { FirebaseAuthGuard } from './interface/jwt.guard'
import { FirebaseAuthService } from './interface/jwt.service'
import { AuthService } from './use_case/auth.service'
import { FirebaseObserver } from './interface/firebase.observer'
import { ConfigModule } from '@nestjs/config'
import authConfig from './auth.config'

@Module({
    imports: [ConfigModule.forFeature(authConfig)],
    providers: [
        {
            provide: APP_GUARD,
            useClass: FirebaseAuthGuard,
        },
        {
            provide: AuthService,
            useClass: FirebaseAuthService,
        },
        FirebaseObserver,
    ],
    exports: [AuthService],
})
export class JWTModule {}
