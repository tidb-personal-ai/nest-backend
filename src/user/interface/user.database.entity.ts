import { AiEntity } from '@ai/interface/ai.database.entities'
import { ChatMessageEntity, ChatSessionEntity, ChatSummaryEntity } from '@app/chat/interface/chat.database.entity'
import { User } from '@user/domain/user.model'
import { Column, Entity, OneToMany, OneToOne, PrimaryColumn } from 'typeorm'

@Entity()
export class UserEntity implements User {
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

    @OneToMany(() => ChatSummaryEntity, (chatSummary) => chatSummary.user)
    summaries: ChatSummaryEntity[]

    @OneToOne(() => ChatSessionEntity, (session) => session.user)
    session: ChatSessionEntity
}
