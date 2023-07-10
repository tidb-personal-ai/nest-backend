import { DataContext } from '@shared/data_context'
import { ChatMessage, ChatSegment } from './chat.domain'

export type EventMap = {
    chatCompletionRequest: ChatCompletionRequest
    chatMessageCreated: ChatMessageCreated
    chatSegmentUpdated: ChatSegmentUpdated
}

export type ChatMessageCreated = {
    message: ChatMessage
    dataContext: DataContext
}

export type ChatSegmentUpdated = {
    chatSegment: ChatSegment
    dataContext: DataContext
}

export type ChatCompletionRequest = {
    chatSegment: ChatSegment
    reply?: ChatMessage
}
