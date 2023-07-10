import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
} from '@nestjs/common'
import { WsException } from '@nestjs/websockets'
import { Socket } from 'socket.io'

/**
 * A filter that catches WebSocket and HTTP exceptions and sends an error message to the client.
 */
@Catch(WsException, HttpException)
export class WebsocketExceptionsFilter implements ExceptionFilter {
    /**
     * Catches WebSocket and HTTP exceptions and sends an error message to the client.
     * @param exception The exception that was thrown.
     * @param host The arguments host.
     */
    catch(exception: WsException | HttpException, host: ArgumentsHost) {
        const client = host.switchToWs().getClient() as Socket
        const data = host.switchToWs().getData()
        const error =
            exception instanceof WsException
                ? exception.getError()
                : exception.getResponse()
        const details =
            error instanceof Object ? { ...error } : { message: error }
        if (client.connected) {
            client.emit('error', {
                id: (client as any).id,
                rid: data.rid,
                ...details,
            })
        }
    }
}
