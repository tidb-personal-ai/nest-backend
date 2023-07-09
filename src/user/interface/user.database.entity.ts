import { AiEntity } from '@ai/interface/ai.database.entities'
import { ChatMessageEntity } from '@app/chat/interface/chat.database.entity'
import { Column, Entity, OneToMany, OneToOne, PrimaryColumn } from 'typeorm'

@Entity()
export class UserEntity {
    @PrimaryColumn()
    uid: string

    @Column({ type: 'varchar', nullable: true })
    name: string | null

    @Column({ type: 'varchar', nullable: true })
    email: string | null

    @Column({ type: 'varchar', nullable: true })
    picture: string | null

    @OneToOne(() => AiEntity, (ai) => ai.user)
    ai: AiEntity

    @OneToMany(() => ChatMessageEntity, (chatMessage) => chatMessage.user)
    history: ChatMessageEntity[]
}
