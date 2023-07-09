import { AuthService } from '@auth/use_case/auth.service'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { User } from '@user/domain/user.model'
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

@Injectable()
export class FirebaseAuthService implements OnModuleInit, AuthService {
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

    async verifyToken(token: string): Promise<User> {
        const decodedToken = await getAuth().verifyIdToken(token, true)
        return {
            uid: decodedToken.uid,
            email: decodedToken.email,
            name: decodedToken.name,
            picture: decodedToken.picture,
        }
    }
}
