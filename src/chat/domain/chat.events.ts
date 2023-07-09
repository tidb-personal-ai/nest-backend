import { DataContext } from '@shared/data_context'
import { ChatMessage, ChatSegment } from './chat.domain'

export type EventMap = {
    chatCompletionRequest: ChatCompletionRequest
    chatMessageCreated: ChatMessageCreated
}

export type ChatMessageCreated = {
    message: ChatMessage
    dataContext: DataContext
}

export type ChatCompletionRequest = {
    chatSegment: ChatSegment
    reply?: ChatMessage
}
