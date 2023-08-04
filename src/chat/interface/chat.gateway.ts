import { AuthService } from '@auth/use_case/auth.service'
import { Inject, Logger, UnauthorizedException, UseFilters, UseGuards } from '@nestjs/common'
import {
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    ConnectedSocket,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { WebsocketExceptionsFilter } from './chat.errors'
import { WsAuthGuard } from '@auth/interface/jwt.guard'
import { ChatInterface, ChatInterfaceMessage, ChatService } from '../use_cases/chat.service'
import { DataContext, InjectDataContext, RequestData } from '@shared/data_context'
import { SocketChatMessage } from './chat.gateway.model'
import { ChatMessage, ChatMessageType } from '@chat/domain/chat.domain'
import { GptService } from './chat.gpt'
import { QueryRunner } from 'typeorm'

/**
 * Gateway for handling WebSocket connections and messages for chat functionality.
 * Implements the `OnGatewayConnection` and `OnGatewayDisconnect` interfaces.
 */
@WebSocketGateway({
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true,
    },
})
@UseFilters(WebsocketExceptionsFilter)
@UseGuards(WsAuthGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() public server: Server
    private logger: Logger = new Logger('ChatGateway')

    constructor(
        @Inject(AuthService) private readonly authService: AuthService,
        private readonly chatService: ChatService,
        private readonly gptService: GptService,
    ) {}

    afterInit() {
        this.logger.log('Chat Socket Initialized')
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`)
        this.chatService.onChatClosed(client.id)
    }

    /**
     * Handles a new WebSocket connection.
     * Verifies the client's access token and adds the client to the list of connected clients.
     * Emits a 'connection' event to the client upon successful connection.
     * @param client The WebSocket client that connected.
     * @throws UnauthorizedException if the client's access token is invalid.
     */
    async handleConnection(client: Socket) {
        try {
            const bearerToken = (client.handshake.auth['Authorization'] as string).split(' ')[1]
            const user = await this.authService.verifyToken(bearerToken)
            this.chatService.onChatOpened(user.uid, new SocketChatInterface(client))
            client.emit('connection', 'Successfully connected to chat')
            this.logger.log(`Client connected: ${client.id}`)
        } catch (error) {
            this.logger.error(`Error while verifying token: ${error.message}`, error)
            const response = new UnauthorizedException('Invalid access token').getResponse() as object
            client.emit('error', {
                id: client.id,
                ...response,
            })
            // disconnects with next tick to allow the client to receive the message from the exception
            setImmediate(() => client.disconnect(true))
        }
    }

    @SubscribeMessage('chat')
    @RequestData('ongoing-transaction', 'user', 'chat-session', 'ai')
    async handleMessage(
        @MessageBody() data: string,
        @InjectDataContext() dataContext: DataContext,
        @ConnectedSocket() client: Socket,
    ): Promise<SocketChatMessage> {
        this.logger.log('Received message')
        const acknowledgment = await this.chatService.getMessageAcknowledged(
            {
                message: data,
                timestamp: new Date(),
                type: ChatMessageType.User,
            },
            dataContext,
        )

        setImmediate(() => {
            this.executeWithTransaction(dataContext, () => this.sendMessageReply(dataContext, client, acknowledgment))
        })
        return {
            message: acknowledgment.message,
            timestamp: acknowledgment.timestamp,
            id: acknowledgment.id,
            sender: 'user',
        }
    }

    @SubscribeMessage('speech')
    @RequestData('ongoing-transaction', 'user', 'chat-session', 'ai')
    async handleAudio(
        @MessageBody() data: string,
        @InjectDataContext() dataContext: DataContext,
        @ConnectedSocket() client: Socket,
    ): Promise<string> {
        const acknowledgment = await this.chatService.getAudioMessageAcknowledged(data, dataContext)
        client.emit('chat', {
            message: acknowledgment.message,
            timestamp: acknowledgment.timestamp,
            id: acknowledgment.id,
            sender: 'user',
        })

        setImmediate(() => {
            this.executeWithTransaction(dataContext, () =>
                this.sendAudioMessageReply(dataContext, client, acknowledgment),
            )
        })
        return 'ack'
    }

    private async sendAudioMessageReply(dataContext: DataContext, client, originalMessage: ChatMessage) {
        const message = await this.sendMessageReply(dataContext, client, originalMessage)
        const response = await this.chatService.getAudioMessageResponse(message)
        this.logger.log('Sending audio reply')
        client.emit('speech', response)
    }

    private async sendMessageReply(dataContext: DataContext, client, originalMessage: ChatMessage) {
        const message = await this.chatService.getMessageReply(originalMessage, dataContext)
        this.logger.log('Sending message reply')
        client.emit('chat', message.isFunctionCall !== undefined 
            ? {
                message: message.message,
                timestamp: message.timestamp,
                id: message.id,
                sender: 'ai',
                isFunctionCall: message.isFunctionCall,
            }
            : {
                message: message.message,
                timestamp: message.timestamp,
                id: message.id,
                sender: 'ai',
            }
        )
        return message
    }

    private async executeWithTransaction<T>(dataContext: DataContext, callback: () => Promise<T>): Promise<T> {
        const transation = dataContext.get<QueryRunner>('transaction')
        try {
            const result = await callback()
            await transation.commitTransaction()
            return result
        } catch (error) {
            await transation.rollbackTransaction()
            this.logger.error(`Error while executing transaction: ${error.message}`, error)
        } finally {
            await transation.release()
        }
    }
}

class SocketChatInterface implements ChatInterface {
    id: string

    constructor(private readonly socket: Socket) {
        this.id = socket.id
    }

    send(message: ChatInterfaceMessage): void {
        this.socket.emit('chat', message)
    }
}
