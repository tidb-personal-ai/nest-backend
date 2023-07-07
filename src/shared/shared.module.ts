import { Global, Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import Emittery from 'emittery'
import { DataContextIntercetor } from './data_context'

@Global()
@Module({
    providers: [
        { provide: Emittery, useValue: new Emittery() },
        { provide: APP_INTERCEPTOR, useClass: DataContextIntercetor },
    ],
    exports: [Emittery],
})
export class SharedModule {}
