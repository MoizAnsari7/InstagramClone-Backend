import { forwardRef, Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationEntity } from './entity/notification.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports : [
    TypeOrmModule.forFeature([NotificationEntity]),
    forwardRef(() => UserModule),
  ],
  exports: [NotificationsService],
  providers: [NotificationsService],
  controllers: [NotificationsController]
})
export class NotificationsModule {}
