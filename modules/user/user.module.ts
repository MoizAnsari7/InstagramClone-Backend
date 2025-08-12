import { forwardRef, Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entity/user.entity';
import { FollowingEntity } from './entity/following.entity';
import { RecentSearchEntity } from './entity/recentSearch.entity';
import { FilesModule } from '../files/files.module';
import { PostsModule } from '../posts/posts.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports : [
    TypeOrmModule.forFeature([UserEntity, FollowingEntity, RecentSearchEntity]),
    FilesModule,
    forwardRef(() => NotificationsModule),
    forwardRef(() => PostsModule)
  ],
  controllers: [UserController],
  providers: [UserService],
  exports : [UserService]
})
export class UserModule {}
