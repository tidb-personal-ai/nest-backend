import { AuthService } from '@auth/use_case/auth.service'
import { Injectable } from '@nestjs/common'
import { User } from '@user/domain/user.model'
import { getAuth } from 'firebase-admin/auth'

@Injectable()
export class FirebaseAuthService implements AuthService {
    async verifyToken(token: string): Promise<User> {
        const decodedToken = await getAuth().verifyIdToken(token, true)
        return {
            uid: decodedToken.uid,
            email: decodedToken.email,
            name: decodedToken.name,
            picture: decodedToken.picture,
            isAdmin: decodedToken.admin,
        }
    }
}
