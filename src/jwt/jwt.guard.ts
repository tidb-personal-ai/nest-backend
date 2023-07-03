import {
    CanActivate,
    ExecutionContext,
    Injectable,
    Logger,
    UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { IS_PUBLIC_KEY } from './jwt.decorator'
import { FirebaseAuthService } from './jwt.service'

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
    private readonly logger = new Logger('FirebaseAuthGuard')
    constructor(
        private readonly reflector: Reflector,
        private readonly authService: FirebaseAuthService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(
            IS_PUBLIC_KEY,
            [context.getHandler(), context.getClass()],
        )
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
            this.logger.error(
                `Error while verifying token: ${error.message}`,
                error,
            )
            throw new UnauthorizedException('Invalid access token')
        }
    }

    private extractTokenFromHeader(request: any): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? []
        return type === 'Bearer' ? token : undefined
    }
}
