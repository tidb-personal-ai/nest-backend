export type ChatSegment = {
    messages: ChatMessage[]
    userId: string
}

export type ChatMessage = {
    message: string
    timestamp: Date
    type: ChatMessageType
    vector?: number[]
    id?: number
}

export enum ChatMessageType {
    User = 'user',
    Ai = 'ai',
    System = 'system',
}

export type ChatSummary = {
    summary: string
    tags: string[]
    messages?: ChatMessage[]
    vector?: number[]
    id?: number
}

export type ChatSessionDomain = 'chat-session'
export const ChatSessionDomain = 'chat-session'
