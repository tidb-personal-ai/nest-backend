import { Global, Module } from '@nestjs/common'
import * as Emittery from 'emittery'
import { UserModule } from '@user/user.module'
import { InterceptableEmittery } from './events.service'

@Global()
@Module({
    imports: [UserModule],
    providers: [{ provide: Emittery, useValue: new InterceptableEmittery() }],
    exports: [Emittery],
})
export class SharedModule {}
