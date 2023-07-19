import { registerAs } from '@nestjs/config'

export default registerAs('auth', () => ({
    firebase: {
        databaseUrl: process.env.FIREBASE_DATABASE_URL,
    },
}))
