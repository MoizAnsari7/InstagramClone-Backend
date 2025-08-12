import { Entity, ManyToOne } from "typeorm";
import { PostEntity } from "./post.entity";
import { BaseEntity } from "src/common/types/base.entity";
import { UserEntity } from "src/modules/user/entity/user.entity";


@Entity()
export class PostLikeEntity extends BaseEntity{
    @ManyToOne(()=> PostEntity, (p)=> p.like,{
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    })
    post : PostEntity

    @ManyToOne(()=> UserEntity, (u)=> u.likedPost,{
        eager: true,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    })
    user : UserEntity
}