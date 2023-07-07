import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { AuthUser } from './domain/user.model'

export const InjectAuthUser = createParamDecorator<
    unknown,
    ExecutionContext,
    AuthUser
>((_data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest()
    return req.authUser
})
