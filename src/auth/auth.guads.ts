import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'

@Injectable()
export class AdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest()
        if(!request.authUser) {
            throw new UnauthorizedException()
        }
        if(!request.authUser.isAdmin) {
            throw new UnauthorizedException('No admin')
        }

        return request.authUser.isAdmin
    }
}