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

/**
 * The `AuthService` interface defines the methods that a service must implement to provide authentication functionality.
 */
export interface AuthService {
    /**
     * Verifies the provided token and returns the user information.
     * @param token The token to verify.
     * @returns The user information.
     * @throws `Error` if the token is invalid.
     * @throws `Error` if the Firebase app is not initialized.
     */
    verifyToken(token: string): Promise<User>
}

export const AuthService = Symbol('AuthService')
