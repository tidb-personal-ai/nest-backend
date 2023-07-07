import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { AuthUser } from '@user/domain/user.model'
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

@Injectable()
export class FirebaseAuthService implements OnModuleInit {
    private readonly logger = new Logger('FirebaseAuthService')

    onModuleInit() {
        try {
            initializeApp()
            this.logger.log('Firebase initialized')
        } catch (error) {
            this.logger.error(
                `Could not initialize Firebase: ${error.message}`,
                error,
            )
        }
    }

    async verifyToken(token: string): Promise<AuthUser> {
        const decodedToken = await getAuth().verifyIdToken(token, true)
        return {
            uid: decodedToken.uid,
            email: decodedToken.email,
        }
    }
}
