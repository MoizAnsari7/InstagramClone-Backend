import { BadRequestException, forwardRef, HttpException, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, Not, Repository } from 'typeorm';

import { UserEntity } from './entity/user.entity';
import { CreateUserDTO, UpdateUserDTO, UserValidationDTO } from './dto/user.dto';
import { FollowingEntity } from './entity/following.entity';
import { RecentSearchEntity } from './entity/recentSearch.entity';
import { FilesService } from '../files/files.service';
import { FileEntity } from '../files/entity/file.entity';
import { PostsService } from '../posts/posts.service';
import { PostEntity } from '../posts/entity/post.entity';
import { NotificationEntity, NotificationType } from '../notifications/entity/notification.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class UserService {

    constructor(
        @InjectRepository(UserEntity) 
        private userRepository : Repository<UserEntity>,
        @InjectRepository(FollowingEntity)
        private readonly userFollowingsRepository: Repository<FollowingEntity>,
        @InjectRepository(RecentSearchEntity)
        private readonly recentSearchRepository: Repository<RecentSearchEntity>,

        @Inject(forwardRef(()=> NotificationsService))
        private notificationService : NotificationsService,

        @Inject(forwardRef(()=> PostsService))
        private postService : PostsService,
        private readonly fileService : FilesService
    ){}

    async getAll(search : string, id : number) : Promise<UserEntity[]>{
        if(search.trim().length === 0){
            return await this.userRepository.find({
                where : {
                    id : Not(id)
                },
                take : 10
            });
        }

        const users = await this.userRepository.createQueryBuilder('user_entity')
            .where('user_entity.username ILIKE :search', {search : `%${search}%`})
            .orWhere('user_entity.name ILIKE :search', {search : `%${search}%`})
            .orWhere('user_entity.email ILIKE :search', {search : `%${search}%`})
            .leftJoinAndSelect('user_entity.avatar', 'avatar')
            .getMany()

        const currentUserIndexInSearchResult = users.findIndex((u) => u.id === id);
        if (currentUserIndexInSearchResult !== -1) users.splice(currentUserIndexInSearchResult, 1);

        return users;
    }

    async getByID(id: number, options: FindOneOptions<UserEntity> = {}): Promise<UserEntity> {
        const user =  await this.userRepository.createQueryBuilder('user')
            .where('user.id = :id', {id})
            .leftJoinAndSelect('user.following', 'following')
            .leftJoinAndSelect('following.target', 'followingTarget')
            .leftJoinAndSelect('followingTarget.avatar', 'followingTargetAvatar')
            .leftJoinAndSelect('user.follower', 'follower')
            .leftJoinAndSelect('follower.user', 'followerUser')
            .leftJoinAndSelect('followerUser.avatar', 'followerUserAvatar')
            .leftJoinAndSelect('user.avatar', 'avatar')
            .leftJoinAndSelect('user.posts', 'posts')
            .leftJoinAndSelect('posts.file', 'file')
            .getOneOrFail();
        
        if(!user){
            throw new HttpException("USER_NOT_FOUND", HttpStatus.NOT_FOUND);
        }
        return user;
    }

    async getUserByEmail(email : string) : Promise<UserEntity>{
        const user =await this.userRepository.findOne({where : {email}})
        if(!user){
            throw new HttpException("USER_NOT_FOUND", HttpStatus.NOT_FOUND);
        }
        return user
    }

    async setUpdateRefreshToken(id :number, hashedRefreshtoken : string){
        await this.userRepository.update(id, {hashedRefreshtoken})
    }

    async createUser(payload : CreateUserDTO): Promise<UserEntity>{
        const existingUser = await this.userRepository.findOne({where : {email : payload.email}});
        if(existingUser){
            throw new HttpException("User already exists", HttpStatus.BAD_REQUEST);
        }
        const user = this.userRepository.create(payload);
        return await this.userRepository.save(user);
    }

    async updateUser(id : number, body : Partial<UpdateUserDTO>) : Promise<UserEntity>{
        const user = await this.userRepository.findOne({where : {id}});
        body.phone = body.phone?.toString();
        if(!user){
            throw new NotFoundException("user not found");
        }
        const newUser = Object.assign(user, body);
        return await this.userRepository.save(newUser);
    }

    async deleteUser(id: number): Promise<void> {
        await this.userRepository.delete(id);
    }

    async uploadUserImage(file : Express.Multer.File, field : 'avatar', id : number) : Promise<FileEntity>{
        const user = await this.userRepository.findOneOrFail({where : {id}});

        const isAlreadyHaveImage = Boolean(user[field]);

        if(isAlreadyHaveImage){
            await this.userRepository.save({
                ...user,
                field : null
            })
            await this.fileService.deleteFile(user[field].id)
        }

        const uploadedFile = await this.fileService.uploadFile({
            file,
            quality : field === 'avatar' ? 5 : 20,
            imageMaxSizeMB : 20,
            type : "image"
        })
        
        await this.userRepository.save({
            ...user,
            [field] : uploadedFile
        })

        return uploadedFile;
    }

    async deleteUserImage(field : 'avatar', id : number) : Promise<void>{
        const user = await this.userRepository.findOneOrFail({where : {id}});

        const isAvatar = Boolean(user[field]);
        if(isAvatar){
            await this.userRepository.save({
                ...user,
                field : null
            })
        }
        await this.fileService.deleteFile(user[field].id);
    }

    async getProfileByUsername(username : string, id : number) : Promise<UserEntity>{
        const viwer = await this.getByID(id);
        const user = await this.userRepository.createQueryBuilder('user')
            .where('user.username = :username', { username })
            .leftJoinAndSelect('user.avatar', 'avatar')
            .leftJoinAndSelect('user.posts', 'posts')
            .leftJoinAndSelect('posts.file', 'file')
            .leftJoinAndSelect('posts.tags', 'tags')
            .leftJoinAndSelect('posts.like', 'likes')
            .leftJoinAndSelect('user.follower', 'follower')
            .leftJoinAndSelect('follower.user', 'followerUser')
            .leftJoinAndSelect('followerUser.avatar', 'followerUserAvatar')
            .leftJoinAndSelect('user.following', 'following')
            .leftJoinAndSelect('following.target', 'followingTarget')
            .leftJoinAndSelect('followingTarget.avatar', 'followingTargetAvatar')
            .orderBy('posts.createdAt', 'DESC')
            .getOne();

        if(!user){
            throw new NotFoundException("User not found")
        }
        user.posts = await Promise.all (
            user.posts.map(async (p)=>{
                return {
                    ...p,
                    isViewerLiked : await this.postService.getIsUserLikedPost(viwer, p)
                }  as unknown as PostEntity
            })
        )

        return {
            user,
            isViewerBlocked : false,
            isviewerFollowed : await this.getIsUserFollowed(id, user.id)
        } as unknown as UserEntity;
    }

    async enable2FA(id : number) : Promise<boolean>{
        await this.userRepository.update(id,{
            isTwoFactorEnable : true
        })
        return true;
    }

    async set2FaSecret(id : number, secret : string) : Promise<boolean>{
        await this.userRepository.update(id, {
            twoFactorSecret : secret
        })
        return true;
    }

    async getNotifications(id : number) : Promise<NotificationEntity[]>{
        const user = await this.userRepository.createQueryBuilder('user')
            .where('user.id = :id', {id})
            .leftJoinAndSelect('user.notifications', 'notification')
            .leftJoinAndSelect('notification.post', 'post')
            .leftJoinAndSelect('post.file', 'file')
            .leftJoinAndSelect('notification.initiatorUser', 'initiatorUser')
            .leftJoinAndSelect('initiatorUser.avatar', 'avatar')
            .orderBy('notification.createdAt', 'DESC')
            .getOneOrFail()

        return user?.notifications;
    }

    async isUsernamTaken(username : string) : Promise<boolean>{
        if(!username) throw new NotFoundException("User Not Found");
        const user = await this.userRepository.findOne({where : {username : username}})
        if(user) return true
        return false;
    }

    async isEmailTaken(email : string) : Promise<boolean>{
        if(!email) throw new NotFoundException("User Not Found");
        const user = await this.userRepository.findOne({where : {email : email}})
        if(user) return true
        return false
    }

    async confirmEmail(email : string){
        const user = await this.userRepository.find({where : {email}});
        await this.userRepository.save({
            ...user,
            isEmailConfirmed : true
        })
        return true
    }


    async followUser(id : number, userId : number) : Promise<void>{
        const user = await this.userRepository.findOneOrFail({where : {id : userId}});
        const target = await this.userRepository.findOneOrFail({where : {id}});

        if(user.id === target.id) return
        const follow = await this.getUserFollowed(id,userId);
        
        if(follow){
            throw new BadRequestException("User already followed")
        }

        await this.userFollowingsRepository.save({
            user,
            target
        })
        await this.notificationService.createNotification({
            notificationType: NotificationType.FOLLOW,
            initiatorUser: user,
            receivedUser: target
        })
    }

    async unfollowUser(id : number, userId : number): Promise<void>{
        const follow = await this.getUserFollowed(id,userId);

        if(follow){
            await this.userFollowingsRepository.delete(follow.id);
            await this.notificationService.deleteLastByInitiatorID(userId, id);
        }
    }

    async getUserFollowed(id : number, userId : number) : Promise<FollowingEntity | null>{
        const following = await this.userFollowingsRepository.createQueryBuilder('follow')
            .where('follow.user.id = :userId', {userId})
            .andWhere('follow.target.id = :id', {id})
            .getOne();

        return following;
    }

    async getIsUserFollowed(currentUserID : number, targetID : number) {
        return Boolean( await this.getUserFollowed(targetID, currentUserID));
    }

    async getUserFollower(id : number) : Promise<FollowingEntity[]>{
        const follower = await this.userFollowingsRepository.createQueryBuilder('following')
            .leftJoinAndSelect('follow.user' , 'user')
            .andWhere('following.target.id =: id' , {id})
            .getMany();
            
        return follower;
    }

    async getUserFollowing(id : number) : Promise<FollowingEntity[]>{
        const following = await this.userFollowingsRepository.createQueryBuilder('following')
            .leftJoinAndSelect('follow.user' , 'user')
            .andWhere('follow.user.id =: id' , {id})
            .getMany();
            
        return following;
    }

    async getRecentSearch(id : number){
        const user = await this.userRepository
        .createQueryBuilder("user")
        .where('user.id = :id', {id})
        .leftJoinAndSelect('user.recentSearch', 'recent_search_entity')
        .orderBy('recent_search_entity.createdAt', 'DESC')
        .getOneOrFail();

        const recentSearch = await Promise.all(
            user.recentSearch.map(async (s)=>{
                return s.type === 'user'
                ? { ...(await this.userRepository.createQueryBuilder('user')
                    .where('user.id = :id', {id : s.itemID})
                    .leftJoinAndSelect('user.avatar', 'avatar')
                    .getOneOrFail()
                    ),
                    recentSearch : s.id
                  }
                : { ...(await this.postService.getTagById(s.itemID)), recentSearch : s.id}
            }
        ))

        return recentSearch;
    }

    async addRecentSearch(id : number, type : 'user'| 'tag', userId : number) : Promise<RecentSearchEntity>{
        const user = await this.userRepository.findOneOrFail({
            where: { id: userId },
            relations : ['recentSearch']
        });
        const index = user.recentSearch.findIndex((r)=>{
            return r.id === id && r.type === type
        })

        if(index !== -1){
            await this.recentSearchRepository.delete(user.recentSearch[index].id)
        }

        const recentSearch = await this.recentSearchRepository.save({
            itemID : id,
            type ,
            user
        })
        return recentSearch;
    }

    async removeRecentSearch(id : number) : Promise<void>{
        if(!id)
        {
            throw new NotFoundException("Not found");
        }
        await this.recentSearchRepository.delete(id);
    }
}