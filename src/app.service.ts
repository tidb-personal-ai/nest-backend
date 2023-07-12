import { Injectable } from '@nestjs/common'
import { User } from '@user/domain/user.model'

@Injectable()
export class AppService {
    getHello(authUser: User): string {
        return `Hello ${authUser.name ?? authUser.email ?? authUser.uid} from Nest`
    }

    getStatus(): string {
        return 'OK'
    }
}
