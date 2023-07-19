import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { EventMap as UserEventMap } from '../domain/user.event'
import * as Emittery from 'emittery'
import { InjectRepository } from '@nestjs/typeorm'
import { UserEntity } from './user.database.entity'
import { Repository } from 'typeorm'

@Injectable()
export class UserDatabaseService implements OnModuleInit {
    constructor(
        @Inject(Emittery)
        private readonly eventBus: Emittery<UserEventMap>,
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>,
    ) {}

    onModuleInit() {
        this.eventBus.on('userDeleted', (event) => this.handleUserDeleted.call(this, event))
    }

    private async handleUserDeleted(event: UserEventMap['userDeleted']) {
        this.userRepository.delete({ uid: event.uid })
    }
}
