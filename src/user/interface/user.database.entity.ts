import { AiEntity } from '@ai/interface/ai.database.entities'
import { Column, Entity, OneToOne, PrimaryColumn } from 'typeorm'

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
}
