import { User } from '@user/domain/user.model'

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
