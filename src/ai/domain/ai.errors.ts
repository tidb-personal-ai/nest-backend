import { CodeError } from '@shared/error.common'

export class AiExists extends CodeError {
    public code = 400
    constructor() {
        super('Ai already created for user')
    }
}
