import { ChatMessage, ChatSegment } from '@chat/domain/chat.domain'
import { UserEntity } from '@user/interface/user.database.entity'
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm'

export enum Sender {
    User = 'user',
    Ai = 'ai',
}

@Entity()
export class ChatMessageEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    timestamp: Date

    @Column('text')
    message: string

    @Column({
        type: 'enum',
        enum: Sender,
        default: Sender.User,
    })
    sender: Sender

    @ManyToOne(() => UserEntity, (user) => user.history, {
        onDelete: 'CASCADE',
    })
    user: UserEntity
}

@Entity()
export class ChatSessionEntity implements ChatSegment {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        type: 'json',
        array: false,
    })
    messages: ChatMessage[]

    @Column()
    userId: string

    @OneToOne(() => UserEntity, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({
        name: 'userId',
        referencedColumnName: 'uid',
    })
    user: UserEntity
}
