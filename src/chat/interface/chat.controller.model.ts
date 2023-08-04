export type GetMessagesRequest = {
    fromId: number
    toId?: number
}

export type GetMessagesResponse = {
    messages: ResponseMessage[]
}

export type ResponseMessage = {
    id: number
    message: string
    timestamp: Date
    sender: MessageSender
}

export type MessageSender = 'user' | 'ai'

export type GetKeywordCountRequest = {
    keyword: string
}

export type GetKeywordCountResponse = {
    count: number
}
