import { Injectable } from '@nestjs/common'
import { AuthUser } from '@user/domain/user.model'

@Injectable()
export class AppService {
    getHello(authUser: AuthUser): string {
        return `Hello ${authUser.email ?? authUser.uid} from Nest!`
    }

    getStatus(): string {
        return 'OK'
    }
}
