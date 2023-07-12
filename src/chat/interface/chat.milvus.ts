import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { InterceptableEmittery } from '@shared/events.service'
import { ConsistencyLevelEnum, DataType, MilvusClient } from '@zilliz/milvus2-sdk-node'
import * as Emittery from 'emittery'
import chatConfig from '../chat.config'
import { EventMap as ChatEventMap } from '../domain/chat.events'
import { EventMap as UserEventMap } from '@user/domain/user.event'
import { ConfigType } from '@nestjs/config'
import { User } from '@user/domain/user.model'

@Injectable()
export class MilvusClientService implements OnApplicationBootstrap {
    private readonly logger: Logger = new Logger('MilvusClientService')
    private milvusClient: MilvusClient

    constructor(
        @Inject(Emittery)
        private readonly eventBus: InterceptableEmittery<ChatEventMap & UserEventMap>,
        @Inject(chatConfig.KEY)
        private readonly config: ConfigType<typeof chatConfig>,
    ) {}

    onApplicationBootstrap() {
        this.milvusClient = new MilvusClient({
            address: this.config.milvus.uri,
            token: this.config.milvus.token,
        })
        this.logger.log('Successfully connected to milvus cluster.')
        this.eventBus.onAfter('chatSummaryCreated', async (event) => {
            await this.handleChatSummaryCreated.call(this, event)
        })
        this.eventBus.on('similarChatSummaryRequest', async (event) => {
            await this.handleSimilarSummaryRequest.call(this, event)
        })
        this.eventBus.on('userDeleted', async (event) => {
            await this.handleUserDeleted.call(this, event)
        })
    }

    private async handleUserDeleted(event: UserEventMap['userDeleted']) {
        const collectionName = this.getSummaryCollectionName(event)
        const collectionExists = (
            await this.milvusClient.hasCollection({ collection_name: collectionName })
        ).value.valueOf()
        if (collectionExists) {
            await this.milvusClient.dropCollection({ collection_name: collectionName })
            this.logger.log(`Successfully dropped collection ${collectionName}.`)
        }
    }

    private async handleSimilarSummaryRequest(event: ChatEventMap['similarChatSummaryRequest']) {
        const user = event.dataContext.get<User>('user')
        const collectionName = this.getSummaryCollectionName(user)
        const collectionExists = (
            await this.milvusClient.hasCollection({ collection_name: collectionName })
        ).value.valueOf()
        if (!collectionExists) {
            return
        }
        const res = await this.milvusClient.search({
            collection_name: collectionName,
            vector: event.message.vector,
            output_fields: ['id'],
            limit: 1,
            consistency_level: ConsistencyLevelEnum.Strong,
        })
        //TODO handle status code
        if (res.results.length > 0) {
            event.summaryId = parseInt(res.results[0].id)
        }
    }

    private getSummaryCollectionName(user: User) {
        return `summaries_${user.uid}`
    }

    private async handleChatSummaryCreated(event: ChatEventMap['chatSummaryCreated']) {
        const user = event.dataContext.get<User>('user')
        const collectionName = this.getSummaryCollectionName(user)
        const collectionExists = (
            await this.milvusClient.hasCollection({ collection_name: collectionName })
        ).value.valueOf()
        if (!collectionExists) {
            await this.milvusClient.createCollection({
                collection_name: collectionName,
                dimension: event.chatSummary.vector.length,
                id_type: DataType.Int64,
            })
            this.logger.log(`Successfully created collection ${collectionName}.`)
        }
        await this.milvusClient.insert({
            collection_name: collectionName,
            data: [
                {
                    id: event.chatSummary.id,
                    vector: event.chatSummary.vector,
                },
            ],
        })
    }
}
