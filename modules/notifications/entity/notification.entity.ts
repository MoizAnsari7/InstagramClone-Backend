import { BaseEntity } from "src/common/types/base.entity";
import { CommentEntity } from "src/modules/posts/entity/comment.entity";
import { PostEntity } from "src/modules/posts/entity/post.entity";
import { UserEntity } from "src/modules/user/entity/user.entity";
import { Column, Entity, ManyToOne } from "typeorm";

export enum NotificationType{
    LIKED_PHOTO = 'likedPhoto',
    LIKED_VIDEO = 'likedVideo',
    LIKED_COMMENT = 'likedComment',
    FOLLOW = 'follow'
}

@Entity()
export class NotificationEntity extends BaseEntity{

    @Column({type : 'enum', enum : NotificationType})
    notificationType : NotificationType

    @Column({default : false})
    isRead : boolean

    @ManyToOne(()=> PostEntity, {
        nullable : true,
        onUpdate : 'CASCADE',
        onDelete : 'CASCADE'
    })
    post : PostEntity;

    @ManyToOne(() => CommentEntity, {
        nullable: true,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    })
    comment: CommentEntity;

    @ManyToOne(()=> UserEntity, (u)=> u.notifications, {
        cascade: true,
    })
    receivedUser : UserEntity

    @ManyToOne(()=> UserEntity,{
        cascade : true
    })
    initiatorUser : UserEntity
}