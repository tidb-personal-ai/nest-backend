import { AudioMessage } from '@chat/domain/chat.domain'
import { ChatInterfaceMessage } from '@chat/use_cases/chat.service'

export type SocketChatMessage = ChatInterfaceMessage
export type SocketAudioMessage = AudioMessage
