import { registerAs } from '@nestjs/config'

export default registerAs('chat', () => ({
    openAi: {
        apiKey: process.env.OPENAI_API_KEY,
    },
    similarityThreshold: parseFloat(process.env.SIMILARITY_THRESHOLD) || 0.74,
}))
