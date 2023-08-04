import { CanActivate, ExecutionContext, Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { IS_PUBLIC_KEY } from '../auth.decorator'
import { AuthService } from '@auth/use_case/auth.service'

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
    private readonly logger = new Logger('FirebaseAuthGuard')
    constructor(
        private readonly reflector: Reflector,
        @Inject(AuthService) private readonly authService: AuthService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ])
        if (isPublic) {
            return true
        }

        const request = context.switchToHttp().getRequest()
        const token = this.extractTokenFromHeader(request)
        if (!token) {
            throw new UnauthorizedException('No access token provided')
        }

        try {
            const user = await this.authService.verifyToken(token)
            request.authUser = user
            return true
        } catch (error) {
            this.logger.error(`Error while verifying token: ${error.message}`, error)
            throw new UnauthorizedException('Invalid access token')
        }
    }

    private extractTokenFromHeader(request: any): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? []
        return type === 'Bearer' ? token : undefined
    }
}

@Injectable()
export class WsAuthGuard implements CanActivate {
    private readonly logger = new Logger('WsAuthGuard')

    constructor(@Inject(AuthService) private readonly authService: AuthService) {}

    async canActivate(context: any) {
        const client = context.switchToWs().getClient()
        const bearerToken = (client.handshake.auth['Authorization'] as string).split(' ')[1]
        try {
            const user = await this.authService.verifyToken(bearerToken)
            client.authUser = user
            return true
        } catch (error) {
            this.logger.error(`Error while verifying token: ${error.message}`, error)
            throw new UnauthorizedException('Invalid access token')
        }
    }
}
