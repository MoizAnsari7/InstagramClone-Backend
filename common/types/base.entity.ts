import { CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";


@Entity()
export abstract class BaseEntity{
    @PrimaryGeneratedColumn()
    readonly id : number

    @CreateDateColumn({type : 'timestamptz', default : ()=> 'CURRENT_TIMESTAMP'})
    readonly createdAt : Date

    @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    readonly updateAt : Date
}