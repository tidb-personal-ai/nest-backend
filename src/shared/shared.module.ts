import { Global, Module } from '@nestjs/common'
import * as Emittery from 'emittery'
import { UserModule } from '@user/user.module'

@Global()
@Module({
    imports: [UserModule],
    providers: [{ provide: Emittery, useValue: new Emittery() }],
    exports: [Emittery],
})
export class SharedModule {}
