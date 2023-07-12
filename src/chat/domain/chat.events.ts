import { DataContext } from '@shared/data_context'
import { ChatMessage, ChatSegment, ChatSummary } from './chat.domain'

export type EventMap = {
    chatCompletionRequest: ChatCompletionRequest
    chatMessageCreated: ChatMessageCreated
    chatSegmentUpdated: ChatSegmentUpdated
    similarChatSummaryRequest: SimilarChatSummaryRequest
    chatSummaryCreated: ChatSummaryCreated
}

export type ChatSummaryCreated = {
    chatSummary: ChatSummary
    dataContext: DataContext
}

export type SimilarChatSummaryRequest = {
    message: ChatMessage
    reply?: ChatSummary
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
    chatFunctions?: ChatFunction[]
    reply?: ChatMessage
    functionCall?: ChatFunctionCall
}

export type ChatFunctionCall = {
    name: string
    parameters: ChatFunctionCallParameter[]
    originalMessage: any
}

export type ChatFunctionCallParameter = {
    name: string
    value: any
}

export type ChatFunction = {
    name: string
    description: string
    parameters: ChatFunctionParameter[]
    force?: boolean
}

export type ChatFunctionParameter = {
    name: string
    description: string
    type: ChatFunctionParameterType
    enumValues?: string[]
    required: boolean
}

export enum ChatFunctionParameterType {
    String = 'string',
    Number = 'number',
    Boolean = 'boolean',
    Enum = 'enum',
}
