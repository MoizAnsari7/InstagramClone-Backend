import { Column, Entity, ManyToOne, OneToMany, Tree, TreeChildren, TreeParent } from "typeorm";
import { PostEntity } from "./post.entity";
import { UserEntity } from "src/modules/user/entity/user.entity";
import { BaseEntity } from "src/common/types/base.entity";
import { CommentLikeEntity } from "./commentLike.entity";

@Entity()
@Tree('materialized-path')
export class CommentEntity extends BaseEntity{
    @Column()
    text : string

    @ManyToOne(()=>PostEntity, (p)=> p.comment, {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    })
    post : PostEntity

    @ManyToOne(()=> UserEntity, (u)=> u.commentedPost,{
        eager :true,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    })
    user : UserEntity

    @OneToMany(()=> CommentLikeEntity, (cl)=>cl.comment, {
        cascade : true,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    })
    commentLikes : CommentLikeEntity[]

    @TreeParent()
    parentComment: CommentEntity | null;
    @TreeChildren()
    replies: CommentEntity[];
}