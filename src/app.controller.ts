import { Controller, Get } from '@nestjs/common'
import { AppService } from './app.service'
import { HelloResponse } from './app.model'
import { InjectAuthUser } from '@user/user.context'
import { User } from '@user/domain/user.model'
import { Public } from '@auth/auth.decorator'

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get()
    getHello(@InjectAuthUser() authUser: User): HelloResponse {
        return {
            message: this.appService.getHello(authUser),
        }
    }

    @Get('status')
    @Public()
    getStatus(): string {
        return this.appService.getStatus()
    }
}
