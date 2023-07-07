import { Global, Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import * as Emittery from 'emittery'
import { DataContextIntercetor } from './data_context'
import { UserModule } from '@user/user.module'

@Global()
@Module({
    imports: [UserModule],
    providers: [
        { provide: Emittery, useValue: new Emittery() },
        { provide: APP_INTERCEPTOR, useClass: DataContextIntercetor },
    ],
    exports: [Emittery],
})
export class SharedModule {}
