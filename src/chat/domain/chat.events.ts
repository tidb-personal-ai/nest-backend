import { ChatMessage, ChatSegment } from './chat.domain'

export type EventMap = {
    chatCompletionRequest: ChatCompletionRequest
}

export type ChatCompletionRequest = {
    chatSegment: ChatSegment
    reply?: ChatMessage
}
