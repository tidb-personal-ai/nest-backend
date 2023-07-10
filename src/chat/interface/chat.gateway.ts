import { AuthService } from '@auth/use_case/auth.service'
import {
    Inject,
    Logger,
    UnauthorizedException,
    UseFilters,
    UseGuards,
} from '@nestjs/common'
import {
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    WebSocketGateway,
    WebSocketServer,
    WsResponse,
    SubscribeMessage,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { WebsocketExceptionsFilter } from './chat.errors'
import { WsAuthGuard } from '@auth/interface/jwt.guard'
import { ChatInterface, ChatService } from '../use_cases/chat.service'
import {
    DataContext,
    InjectDataContext,
    RequestData,
} from '@shared/data_context'
import { SocketChatMessage } from './chat.gateway.model'
import { ChatMessageType } from '@chat/domain/chat.domain'

/**
 * Gateway for handling WebSocket connections and messages for chat functionality.
 * Implements the `OnGatewayConnection` and `OnGatewayDisconnect` interfaces.
 */
@WebSocketGateway()
@UseFilters(WebsocketExceptionsFilter)
@UseGuards(WsAuthGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() public server: Server
    private logger: Logger = new Logger('ChatGateway')

    constructor(
        @Inject(AuthService) private readonly authService: AuthService,
        private readonly chatService: ChatService,
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
            const bearerToken =
                client.handshake.headers.authorization.split(' ')[1]
            const user = await this.authService.verifyToken(bearerToken)
            this.chatService.onChatOpened(
                user.uid,
                new SocketChatInterface(client),
            )
            client.emit('connection', 'Successfully connected to chat')
            this.logger.log(`Client connected: ${client.id}`)
        } catch (error) {
            this.logger.error(
                `Error while verifying token: ${error.message}`,
                error,
            )
            const response = new UnauthorizedException(
                'Invalid access token',
            ).getResponse() as object
            client.emit('error', {
                id: client.id,
                ...response,
            })
            // disconnects with next tick to allow the client to receive the message from the exception
            setImmediate(() => client.disconnect(true))
        }
    }

    @SubscribeMessage('chat')
    @RequestData('transaction', 'user', 'chat-session')
    async handleMessage(
        @MessageBody() data: string,
        @InjectDataContext() dataContext: DataContext,
    ): Promise<WsResponse<SocketChatMessage>> {
        const event = 'chat'
        this.logger.log(`Received message: ${JSON.stringify(data)}`)
        const message = await this.chatService.getMessageReply(
            {
                message: data,
                timestamp: new Date(),
                type: ChatMessageType.User,
            },
            dataContext,
        )
        return { event, data: message }
    }
}

class SocketChatInterface implements ChatInterface {
    id: string

    constructor(private readonly socket: Socket) {
        this.id = socket.id
    }

    send(message: string): void {
        this.socket.emit('chat', message)
    }
}
