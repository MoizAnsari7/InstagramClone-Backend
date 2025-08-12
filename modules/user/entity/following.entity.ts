import { Entity, ManyToOne } from "typeorm";
import { UserEntity } from "./user.entity";
import { BaseEntity } from "src/common/types/base.entity";

@Entity()
export class FollowingEntity extends BaseEntity{

    @ManyToOne(()=> UserEntity, (user)=> user.following,{
        cascade : true
    })
    user : UserEntity;
    
    @ManyToOne(()=> UserEntity, (user)=> user.follower,{
        cascade : true
    })
    target : UserEntity;
}