import { forwardRef, Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEntity } from './entity/post.entity';
import { PostLikeEntity } from './entity/postLike.entity';
import { CommentEntity } from './entity/comment.entity';
import { CommentLikeEntity } from './entity/commentLike.entity';
import { ReportEntity } from './entity/report.entity';
import { TagEntity } from './entity/tag.entity';
import { UserModule } from '../user/user.module';
import { FilesModule } from '../files/files.module';
import { PostFeedEntity } from './entity/postFeed.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports : [
    TypeOrmModule.forFeature([PostEntity, PostLikeEntity, CommentEntity, CommentLikeEntity, ReportEntity, TagEntity, PostFeedEntity]),
    FilesModule,
    NotificationsModule,
    forwardRef(() => UserModule),
  ],
  providers: [PostsService],
  controllers: [PostsController],
  exports : [PostsService]

})
export class PostsModule {}
