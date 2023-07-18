import { AuthService } from '@auth/use_case/auth.service'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { User } from '@user/domain/user.model'
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getDatabaseWithUrl } from 'firebase-admin/database'

@Injectable()
export class FirebaseAuthService implements OnModuleInit, AuthService {
    private readonly logger = new Logger('FirebaseAuthService')

    onModuleInit() {
        try {
            initializeApp()
            //TODO react to users childremoved to detect delete user event
            getDatabaseWithUrl('https://tidb-personal-ai-default-rtdb.europe-west1.firebasedatabase.app/')
                .ref('users/registered')
                .on('child_removed', (snapshot) => {
                    this.logger.warn(`user deleted: ${JSON.stringify(snapshot.val(), undefined, 2)}`)
                })
            this.logger.log('Firebase initialized')
        } catch (error) {
            this.logger.error(`Could not initialize Firebase: ${error.message}`, error)
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
