import { registerAs } from '@nestjs/config'

export default registerAs('chat', () => ({
    openAi: {
        apiKey: process.env.OPENAI_API_KEY,
    },
}))
