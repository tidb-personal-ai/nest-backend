export type ChatSegment = {
    messages: ChatMessage[]
    userId: string
}

export type ChatMessage = {
    message: string
    timestamp: Date
    type: ChatMessageType
}

export enum ChatMessageType {
    User = 'user',
    Ai = 'ai',
    System = 'system',
}

export type ChatSessionDomain = 'chat-session'
export const ChatSessionDomain = 'chat-session'
