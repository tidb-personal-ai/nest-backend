import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { User } from './domain/user.model'

export const InjectAuthUser = createParamDecorator<unknown, ExecutionContext, User>(
    (_data: unknown, ctx: ExecutionContext) => {
        const req = ctx.switchToHttp().getRequest()
        return req.authUser
    },
)
