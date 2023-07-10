import { Ai } from '@ai/domain/ai.domain'
import { UserEntity } from '@user/interface/user.database.entity'
import {
    Column,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm'

@Entity()
export class AiEntity implements Ai {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column('simple-array')
    traits: string[]

    @OneToOne(() => UserEntity, {
        onDelete: 'CASCADE',
    })
    @JoinColumn()
    user: UserEntity
}
