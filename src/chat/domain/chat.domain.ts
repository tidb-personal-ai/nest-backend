export type ChatSegment = {
    messages: ChatMessage[]
    userId: string
}

export type ChatMessage = {
    message: string
    timestamp: Date
    type: ChatMessageType
    functionName?: string
    vector?: number[]
    id?: number
}

export type AudioMessage = {
    audio: string
    mime: string
    id: number
}

export enum ChatMessageType {
    User = 'user',
    Ai = 'ai',
    System = 'system',
    Function = 'function'
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
