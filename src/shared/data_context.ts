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
import { UserDomain } from '@user/domain/user.model'
import { Observable } from 'rxjs'

export class DataContext {
    private readonly _data = new Map<Domain, any>()

    get<T>(key: Domain): T {
        return this._data.get(key) as T
    }

    set<T>(key: Domain, value: T) {
        this._data.set(key, value)
    }

    has(key: Domain): boolean {
        return this._data.has(key) && this._data.get(key) !== undefined
    }
}

@Injectable()
export class DataContextIntercetor implements NestInterceptor {
    constructor(private readonly reflector: Reflector) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest()
        const dataContext = new DataContext()
        req.dataContext = dataContext

        const domains = this.reflector.get<Domain[]>(
            'domains',
            context.getHandler(),
        )
        //TODO Get data from database

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
