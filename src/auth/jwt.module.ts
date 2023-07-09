import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { FirebaseAuthGuard } from './interface/jwt.guard'
import { FirebaseAuthService } from './interface/jwt.service'
import { AuthService } from './use_case/auth.service'

@Module({
    providers: [
        {
            provide: APP_GUARD,
            useClass: FirebaseAuthGuard,
        },
        {
            provide: AuthService,
            useClass: FirebaseAuthService,
        },
    ],
    exports: [AuthService],
})
export class JWTModule {}
