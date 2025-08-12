import { Column, Entity, ManyToOne } from "typeorm";
import { UserEntity } from "./user.entity";
import { BaseEntity } from "src/common/types/base.entity";

@Entity()
export class RecentSearchEntity extends BaseEntity{
    @Column()
    itemID : number

    @Column()
    type : 'user' | 'tag'

    @ManyToOne(()=> UserEntity, (u)=> u.recentSearch,{
        cascade : true
    })
    user : UserEntity
}