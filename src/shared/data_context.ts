import { AiDomain } from '@ai/domain/ai.domain'
import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
    SetMetadata,
    UseInterceptors,
    applyDecorators,
    createParamDecorator,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { InjectRepository } from '@nestjs/typeorm'
import { UserDomain } from '@user/domain/user.model'
import { UserEntity } from '@user/interface/user.database.entity'
import { Observable } from 'rxjs'
import { Repository } from 'typeorm'

export class DataContext {
    private readonly _data = new Map<Domain, any>()

    get<T>(key: Domain): T {
        return this._data.get(key) as T
    }

    set<T>(key: Domain, value: T) {
        this._data.set(key, value)
    }

    has(key: Domain): boolean {
        return (
            this._data.has(key) &&
            this._data.get(key) !== undefined &&
            this._data.get(key) !== null
        )
    }
}

@Injectable()
export class DataContextIntercetor implements NestInterceptor {
    constructor(
        private readonly reflector: Reflector,
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>,
    ) {}

    async intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Promise<Observable<any>> {
        const req = context.switchToHttp().getRequest()
        const dataContext = new DataContext()
        req.dataContext = dataContext

        const domains =
            this.reflector.get<Domain[]>('domains', context.getHandler()) ?? []
        let user = await this.userRepository.findOne({
            where: {
                uid: req.authUser.uid,
            },
            relations: {
                ai: domains.includes(AiDomain),
            },
        })
        if (!user) {
            user = this.userRepository.create({
                uid: req.authUser.uid,
                email: req.authUser.email,
                name: req.authUser.name,
                picture: req.authUser.picture,
            })
            await this.userRepository.save(user)
        }
        domains.forEach((domain) => {
            if (domain === UserDomain) {
                dataContext.set(domain, user)
            } else if (domain === AiDomain) {
                dataContext.set(domain, user.ai)
            }
        })

        return next.handle()
    }
}

export function RequestData(...domains: Domain[]) {
    return applyDecorators(
        SetMetadata('domains', domains),
        UseInterceptors(DataContextIntercetor),
    )
}

export const InjectDataContext = createParamDecorator<
    unknown,
    ExecutionContext,
    DataContext
>((_data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest()
    return req.dataContext
})

export type Domain = AiDomain | UserDomain
