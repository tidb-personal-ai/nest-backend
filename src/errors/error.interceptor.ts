import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    HttpStatus,
    HttpException,
} from '@nestjs/common'
import { Observable, throwError } from 'rxjs'
import { catchError } from 'rxjs/operators'

@Injectable()
export class ErrorsInterceptor implements NestInterceptor {
    constructor(private readonly config: { debug: boolean }) {}

    intercept(_: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            catchError((err: any) => {
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

                const { code, ...meta } = err
                const message = err.message || 'unknown error'
                return throwError(
                    () =>
                        new HttpException(
                            this.config.debug
                                ? meta
                                    ? { message, ...meta }
                                    : message
                                : message,
                            code || HttpStatus.INTERNAL_SERVER_ERROR,
                        ),
                )
            }),
        )
    }
}
