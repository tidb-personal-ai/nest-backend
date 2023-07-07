export type GetAiResponse = {
    exists: boolean
    ai?: AiResponse
}

export type AiResponse = {
    name: string
    traits: string[]
}

export type CreateAiRequest = {
    name: string
    traits: string[]
}
