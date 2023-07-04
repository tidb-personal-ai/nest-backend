import { isDevEnvironment } from '@app/helpers/environment'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { AuthUser } from '@user/user.model'
import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

@Injectable()
export class FirebaseAuthService implements OnModuleInit {
    private readonly logger = new Logger('FirebaseAuthService')

    onModuleInit() {
        try {
            if (isDevEnvironment) {
                this.logger.log('Initializing Firebase in dev environment')
                initializeApp({
                    credential: applicationDefault(),
                    //databaseURL:
                    //    'https://tidb-personal-ai-default-rtdb.europe-west1.firebasedatabase.app',
                })
            } else {
                this.logger.log('Initializing Firebase in prod environment')
                initializeApp()
            }
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
