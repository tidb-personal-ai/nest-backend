import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { AuthUser } from '@user/user.model'
import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

@Injectable()
export class FirebaseAuthService implements OnModuleInit {
    private readonly logger = new Logger('FirebaseAuthService')

    onModuleInit() {
        initializeApp({
            credential: applicationDefault(),
            //databaseURL:
            //    'https://tidb-personal-ai-default-rtdb.europe-west1.firebasedatabase.app',
        })
        this.logger.log('Firebase initialized')
    }

    async verifyToken(token: string): Promise<AuthUser> {
        const decodedToken = await getAuth().verifyIdToken(token, true)
        return {
            uid: decodedToken.uid,
            email: decodedToken.email,
        }
    }
}
