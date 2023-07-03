import { Controller, Get } from '@nestjs/common'
import { AppService } from './app.service'
import { HelloResponse } from './app.model'
import { InjectAuthUser } from '@user/user.context'
import { AuthUser } from '@user/user.model'

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get()
    getHello(@InjectAuthUser() authUser: AuthUser): HelloResponse {
        return {
            message: this.appService.getHello(authUser),
        }
    }
}
