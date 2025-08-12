import { BaseEntity } from "src/common/types/base.entity";
import { UserEntity } from "src/modules/user/entity/user.entity";
import { Entity, ManyToOne } from "typeorm";
import { PostEntity } from "./post.entity";

@Entity()
export class PostFeedEntity extends BaseEntity{
    @ManyToOne(()=>UserEntity, (u)=> u.postfeed, {
        cascade : true
    })
    user : UserEntity

    @ManyToOne(()=> PostEntity, (p)=> p.feeds, {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    })
    post : PostEntity
}