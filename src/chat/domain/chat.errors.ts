import { CodeError } from '@shared/error.common'

export class NoAiResponse extends CodeError {
    public code = 500
    constructor() {
        super('No AI response')
    }
}

export class InvalidFunctionCall extends CodeError {
    public code = 500
    constructor(
        functionName: string,
        public call: any,
    ) {
        super(`Invalid function call from AI: ${functionName}`)
    }
}
