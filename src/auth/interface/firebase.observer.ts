import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { initializeApp } from 'firebase-admin/app'
import { getDatabaseWithUrl } from 'firebase-admin/database'
import { getAuth } from 'firebase-admin/auth'
import { EventMap as UserEventMap } from '@user/domain/user.event'
import { ConfigType } from '@nestjs/config'
import * as Emittery from 'emittery'

import authConfig from '../auth.config'

@Injectable()
export class FirebaseObserver implements OnModuleInit {
    private readonly logger = new Logger('FirebaseObserver')

    constructor(
        @Inject(Emittery)
        private readonly eventBus: Emittery<UserEventMap>,
        @Inject(authConfig.KEY)
        private readonly config: ConfigType<typeof authConfig>,
    ) {}

    async onModuleInit() {
        try {
            initializeApp()
            if(this.config.firebase.adminUid) {
                await getAuth().setCustomUserClaims(this.config.firebase.adminUid, {
                    admin: true
                })
            }

            getDatabaseWithUrl(this.config.firebase.databaseUrl)
                .ref('users/registered')
                .on('child_removed', (snapshot) => {
                    const uid = snapshot.val().userId
                    this.logger.log(`user ${uid} was removed from the database`)
                    this.eventBus.emit('userDeleted', { uid })
                })

            this.logger.log('Firebase initialized')
        } catch (error) {
            this.logger.error(`Could not initialize Firebase: ${error.message}`, error)
        }
    }
}
