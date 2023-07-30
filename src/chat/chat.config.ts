import { registerAs } from '@nestjs/config'

export default registerAs('chat', () => ({
    openAi: {
        apiKey: process.env.OPENAI_API_KEY,
    },
    milvus: {
        uri: process.env.MILVUS_URI || 'https://in03-d9227e4a1877913.api.gcp-us-west1.zillizcloud.com',
        token: process.env.MILVUS_TOKEN,
    },
    deepgram: {
        apiKey: process.env.DEEPGRAM_API_KEY,
    },
    similarityThreshold: parseFloat(process.env.SIMILARITY_THRESHOLD) || 0.72,
    maxTokens: parseInt(process.env.MAX_TOKENS) || 3800,
}))
