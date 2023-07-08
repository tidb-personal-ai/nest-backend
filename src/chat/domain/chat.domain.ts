export type ChatSegment = {
    messages: ChatMessage[]
    userId: string
}

export type ChatMessage = {
    text: string
    timestamp: Date
    type: ChatMessageType
}

export enum ChatMessageType {
    User = 'user',
    Ai = 'ai',
    System = 'system',
}
