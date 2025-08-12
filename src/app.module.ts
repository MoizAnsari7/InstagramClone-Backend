import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { PostsModule } from './modules/posts/posts.module';
import { FilesModule } from './modules/files/files.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuthModule } from './modules/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth/jwt-auth.guard';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    TypeOrmModule.forRoot({
      type : 'postgres',
      url : process.env.DATABASE_URL,
      autoLoadEntities : true,
      synchronize :true
    }),
    UserModule, PostsModule, FilesModule, NotificationsModule, AuthModule],
  controllers: [AppController],
  providers: [
    {
      provide : APP_GUARD,
      useClass : JwtAuthGuard
    },
    AppService],
})

export class AppModule {}
