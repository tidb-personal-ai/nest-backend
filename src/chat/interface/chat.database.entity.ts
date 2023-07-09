import { UserEntity } from '@user/interface/user.database.entity'
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'

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
