export type User = {
    uid: string
    email?: string
    name?: string
    picture?: string
    isAdmin?: boolean
}

export type UserDomain = 'user'
export const UserDomain = 'user'
