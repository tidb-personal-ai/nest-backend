import { DataContext } from '@shared/data_context'
import { Ai } from './ai.domain'

export type EventMap = {
    aiCreated: AiCreated
}

export type AiCreated = {
    ai: Ai
    dataContext: DataContext
}
