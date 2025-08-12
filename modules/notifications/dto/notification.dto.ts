import { CommentEntity } from "src/modules/posts/entity/comment.entity";
import { NotificationType } from "../entity/notification.entity";
import { UserEntity } from "src/modules/user/entity/user.entity";
import { PostEntity } from "src/modules/posts/entity/post.entity";

export class createNotificationDto{
    notificationType : NotificationType
    post?: PostEntity
    comment?: CommentEntity
    receivedUser : UserEntity
    initiatorUser : UserEntity
}