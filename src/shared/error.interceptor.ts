import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    HttpStatus,
    HttpException,
    Logger,
} from '@nestjs/common'
import { Observable, throwError } from 'rxjs'
import { catchError } from 'rxjs/operators'

@Injectable()
export class ErrorsInterceptor implements NestInterceptor {
    private logger: Logger = new Logger('ErrorsInterceptor')

    constructor(private readonly config: { debug: boolean }) {}

    intercept(_: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            catchError((err: any) => {
                this.logger.error(err.message, err.stack)
                // Forward all HttpExceptions to the requester regardless, this
                // errors are already processed.
                if (err instanceof HttpException) return throwError(() => err)

                // Database errors details are hidden from the response to prevent
                // data leakage at any cost. Yet it's a 'hidden' behavior since
                // errors are intercepted globally, but the cost of missing this is
                // to high.
                /* if (err instanceof BaseError && !this.config.debug) {
                    return throwError(
                        () =>
                            new HttpException(
                                { error: 'bad request' },
                                HttpStatus.BAD_REQUEST,
                            ),
                    )
                } */

                // eslint-disable-next-line prefer-const
                let { code, ...meta } = err
                code = parseInt(code, 10)
                if (isNaN(code)) code = undefined

                const message = code ? err.message || 'Internal server error' : 'Internal server error'
                return throwError(
                    () =>
                        new HttpException(
                            this.config.debug ? (meta ? { message, ...meta } : message) : message,
                            code || HttpStatus.INTERNAL_SERVER_ERROR,
                        ),
                )
            }),
        )
    }
}
