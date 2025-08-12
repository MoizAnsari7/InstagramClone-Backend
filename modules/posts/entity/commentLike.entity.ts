import { Entity, ManyToOne } from "typeorm";
import { CommentEntity } from "./comment.entity";
import { UserEntity } from "src/modules/user/entity/user.entity";
import { BaseEntity } from "src/common/types/base.entity";


@Entity()
export class CommentLikeEntity extends BaseEntity{
    @ManyToOne(()=>CommentEntity, (c)=> c.commentLikes,{
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    })
    comment : CommentEntity

    @ManyToOne(()=> UserEntity, (u)=> u.likedComments, {
        eager: true,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    })
    user : UserEntity
}
