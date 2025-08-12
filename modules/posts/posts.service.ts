import { forwardRef, HttpException, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PostEntity } from './entity/post.entity';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TagEntity } from './entity/tag.entity';
import { UserEntity } from '../user/entity/user.entity';
import { UserService } from '../user/user.service';
import { CreateCommentDTO, CreatePostDTO, UpdatePostDTO } from './dto/post.dto';
import { FilesService } from '../files/files.service';
import { PostFeedEntity } from './entity/postFeed.entity';
import { CommentEntity } from './entity/comment.entity';
import { PostReportTypes, ReportEntity } from './entity/report.entity';
import { PostLikeEntity } from './entity/postLike.entity';
import { CommentLikeEntity } from './entity/commentLike.entity';
import { IPaginationOptions, paginate, Pagination } from 'nestjs-typeorm-paginate';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entity/notification.entity';

@Injectable()
export class PostsService {

    constructor(
        @InjectRepository(PostEntity) private postRepository : Repository<PostEntity>,
        @InjectRepository(TagEntity) private tagRepository : Repository<TagEntity>,
        @InjectRepository(PostFeedEntity) private postFeedRepository : Repository<PostFeedEntity>,
        @InjectRepository(CommentEntity) private commentRepository : Repository<CommentEntity>,
        @InjectRepository(ReportEntity) private reportRepository : Repository<ReportEntity>,
        @InjectRepository(PostLikeEntity) private postLikeRepository : Repository<PostLikeEntity>,
        @InjectRepository(CommentLikeEntity) private commentLikeRepository : Repository<CommentLikeEntity>,

        @Inject(forwardRef(() => UserService)) private readonly userService : UserService,
        private readonly fileService : FilesService,

        private readonly notificationsService : NotificationsService,
        private dataSource : DataSource
    ){}

    async getAll(options :IPaginationOptions = {page : 1, limit : 10}, tag = '', userId : number) : Promise<Pagination<PostEntity>>{
        const user = await this.userService.getByID(userId);
        if(!tag){
            const userFeed = await this.postFeedRepository.createQueryBuilder('feed')
                .where('feed.user = :userId', {userId})
                .leftJoinAndSelect('feed.post', 'post')
                .leftJoinAndSelect('post.user', 'user')
                .leftJoinAndSelect('user.avatar', 'avatar')
                .leftJoinAndSelect('post.file', 'file')
                .leftJoinAndSelect('post.tags', 'tags')
                .leftJoinAndSelect('post.like', 'like')
                .orderBy('post.createdAt', 'DESC')
                .take(Number(options.limit))
                .skip((Number(options.page) - 1) * Number(options.limit))
                .getMany()

            const feedPost = userFeed.map((f)=> f.post);

            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const userLatesPost = await this.postRepository.createQueryBuilder('post')
                .where('post.user = :userId', {userId})
                // .andWhere('post.createdAt > :yesterday', {yesterday})
                .leftJoinAndSelect('post.user', 'user')
                .leftJoinAndSelect('user.avatar', 'avatar')
                .leftJoinAndSelect('post.file', 'file')
                .leftJoinAndSelect('post.tags', 'tag')
                .leftJoinAndSelect('post.like', 'like')
                .orderBy('post.createdAt', 'DESC')
                .take(5)
                .getMany()

            const allPost = [...userLatesPost, ...feedPost];

            const formattedFeedPost = await Promise.all(
                allPost.map(async (p)=> await this.formatFeedPost(p, user, tag))
            );

            if(formattedFeedPost.length){
                return {
                    items : formattedFeedPost,
                    meta : {
                        currentPage : Number(options.page),
                        itemCount : formattedFeedPost.length,
                        itemsPerPage : Number(options.limit),
                        totalItem : 50,
                        totalPage : 10
                    }
                }
            }
        }

        const queryBuilder = this.postRepository.createQueryBuilder('post')
            .leftJoin('post.like', 'like')
            .leftJoin('post.comment', 'comment')
            .addSelect(`COUNT(like.id) + COUNT(comment.id) * 5 / (EXTRACT(EPOCH FROM NOW()) - EXTRACT(EPOCH FROM post.createdAt))`, 'score')
            .leftJoinAndSelect('post.user', 'user')
            .leftJoinAndSelect('user.avatar', 'avatar')
            .leftJoinAndSelect('post.file', 'file')
            .leftJoinAndSelect('post.tags', 'tags')
            .orderBy('score', 'DESC')
            .groupBy('post.id')
            .addGroupBy('user.id')
            .addGroupBy('avatar.id')
            .addGroupBy('file.id')
            .addGroupBy('tags.id')

            if(tag) {
                queryBuilder.where('tags.name IN :tag', { tag }); 
            }
            else {
            const postsFeed = await this.postFeedRepository
                .createQueryBuilder('feed')
                .select('feed.id')
                .where('feed.user.id = :userId', { userId })
                .getMany();
            const postsFeedIDs = postsFeed.map((pf) => pf.id);

            if (postsFeedIDs.length) queryBuilder.where('post.id NOT IN (:...postsFeedIDs)', { postsFeedIDs });
            }

            const { items, meta } = await paginate<PostEntity>(queryBuilder, options);

            const formattedPosts = (await Promise.all(
            items.map(async (p) => await this.formatFeedPost(p, user, tag))
            )) as PostEntity[];
            return { items: formattedPosts, meta };
    }

    async formatFeedPost(post : PostEntity, user : UserEntity, tag : string) : Promise<PostEntity>{
        return {
            ...post,
            user : {
                ...post.user,
                isViewerFollwed : post.user.id === user.id ? false : await this.userService.getIsUserFollowed( user.id, post.user.id)
            }  as unknown as UserEntity,
            comment : tag ? [] : await this.commentRepository.find({where : {post}, order : {createdAt : 'DESC'}, take : 2}),
            like: await this.postLikeRepository.find({
                where: { post: { id: post.id } },
            }),
            isViewerLiked : await this.getIsUserLikedPost(user,post),
            isPostSaved : false,
            isViewerInPhoto: false,
        } as unknown as PostEntity
    }

    async getPostById(id : number) : Promise<PostEntity>{
        return await this.postRepository.findOneOrFail({
            where : {id},
            relations : ['user', 'tags','file']
        })
    }

    async getComments(id : number, userId : number) : Promise<Partial<CommentEntity>[]>{

        const currentUserRootComment = await this.commentRepository.createQueryBuilder('comment')
            .leftJoinAndSelect('comment.user', 'user')
            .leftJoinAndSelect('user.avatar', 'avatar')
            .where('user.id = :userId', {userId})
            .andWhere('comment.post.id = :id', {id})
            .orderBy('comment.createdAt', 'DESC')
            .getMany()

        const RestUserRootComment = await this.commentRepository.createQueryBuilder('comment')
            .leftJoinAndSelect('comment.user', 'user')
            .leftJoinAndSelect('user.avatar', 'avtar')
            .where('user.id != :userId', {userId})
            .where('comment.post.id = :id', {id})
            .orderBy('comment.createdAt', 'DESC')
            .getMany()
    
        console.log(currentUserRootComment);
        console.log(RestUserRootComment);
        
        const allComments = [...currentUserRootComment, ...RestUserRootComment]

        const treeRepository = this.dataSource.getTreeRepository(CommentEntity);

        return await Promise.all(
            allComments.map(async (c) => {
                const { replies } = await treeRepository.findDescendantsTree(c, { relations: ['user'] });

                return {
                ...c,
                replies,
                isViewerLiked: Boolean(
                    await this.postLikeRepository
                    .createQueryBuilder('commentLike')
                    .where('commentLike.user.id = :currentUserID', { userId })
                    .andWhere('commentLike.comment.id = :commentID', { commentID: c.id })
                    .getRawOne()
                ),
                };
            })
        );
    }

    async getLikes(id : number, currentUserID : number): Promise<Partial<UserEntity>[]>{
        const post = await this.postRepository.findOneOrFail({
            where : {id},
            relations : ['like', 'like.user']
        });

        return await Promise.all(
            post.like.map(async(l)=>{
                return{
                    ...l.user,
                    isViewerFollowed : await this.userService.getIsUserFollowed(currentUserID, l.user.id)
                }
            })
        )
    }

    async getLikedPostsByUserID(id: number): Promise<PostEntity[]> {
        const likes = await this.postLikeRepository.createQueryBuilder('likes')
            .where('user.id = :id', { id })
            .leftJoinAndSelect('likes.post', 'post')
            .getMany();
        return likes.map((l) => l.post);
    }

    async getIsUserLikedPost(user: UserEntity, post: PostEntity): Promise<boolean> {
        return Boolean(await this.postLikeRepository.createQueryBuilder('like')
            .where('like.user.id = :userId', {userId : user.id})
            .andWhere('like.post.id = :postId', {postId : post.id})
            .getOne()
        );
    }

    async getTags(search : string) : Promise<TagEntity[]>{
        return await this.tagRepository.createQueryBuilder('tag')
            .leftJoin('tag.posts', 'posts')
            .addSelect('Count(posts)', 'count')
            .where('tag.name ILIKE :search' , {search : `%${search}%`})
            .orderBy('count', 'DESC')
            .groupBy('tag.id')
            .take(20)
            .getMany();
    }

    async getTagById(id : number) : Promise<TagEntity>{
        return await this.tagRepository.createQueryBuilder('tag')
            .where('tag.id =: id', {id})
            .leftJoinAndSelect('tag.post', 'post')
            .loadRelationCountAndMap('tag.postsNumber', 'tag.posts')
            .getOneOrFail();
    }

    async getTagByName(name : string) : Promise<TagEntity>{
        return await this.tagRepository.createQueryBuilder('tag')
            .where('tag.name =: name', {name})
            .loadRelationCountAndMap('tag.postNumber', 'tag.post')
            .getOneOrFail()
    }

    async createPost(file : Express.Multer.File, payload : CreatePostDTO,id : number) : Promise<PostEntity> {
        const user = await this.userService.getByID(id);

        const uploadedFile = await this.fileService.uploadFile({
            file,
            quality : 95,
            imageMaxSizeMB : 20,
            type : 'image'
        })

        const post = await this.postRepository.save({
            description : payload.description,
            file :uploadedFile,
            user
        })

        try{
            const parseTag = JSON.parse(payload.tags);
            const formattedTag = await Promise.all(
                parseTag.map(async (tag)=>{
                const dbTag = await this.tagRepository.findOne({where : {name : tag}})
                if(!dbTag){
                    const tagEntity = await this.tagRepository.save({ name: tag });
                    return tagEntity
                }
                else{
                    return dbTag
                }
            }))

            const savedPost = await this.postRepository.save({
                ...post,
                tags : formattedTag
            })

            const userFollowers = await this.userService.getUserFollower(id);

            await Promise.all(
                userFollowers.map(async(follower)=>{
                    await this.postFeedRepository.save({
                        user : follower,
                        post : savedPost
                    })
                    const feedCount = await this.postFeedRepository.count({ where: { user: follower.user } });
                    console.log('feedCount', feedCount);
                    const maxUserFeedNumber = 20;
                    if (feedCount > maxUserFeedNumber) {
                        const oldestPost = await this.postFeedRepository.findOneOrFail({
                        where: { user: follower.user },
                        order: { createdAt: 'ASC' },
                        });
                        await this.postFeedRepository.delete(oldestPost.id);
                    }
                })
            )
        }
        catch(error){
            console.log(error)
        }
        return post
    }

    async updatePost(id : number, payload : Partial<UpdatePostDTO>) : Promise<PostEntity>{
        const post = await this.postRepository.findOneOrFail({where : {id}});
        if(payload.tags){
            try{
                const parsedTag = JSON.parse(payload.tags);
                const formattedTag = await Promise.all(
                    parsedTag.map(async (tag)=>{
                        const dbTag = await this.tagRepository.findOne({where : {name : tag}});
                        if(!dbTag){
                            return await this.tagRepository.save({
                                name : tag,
                                post : id
                            })
                        }
                        return dbTag
                    })
                )

                const formattedPost = {
                    ...payload,
                    tags : formattedTag
                }

                const updatePost = await this.postRepository.save({
                    ...post ,
                    ...formattedPost
                })

                return updatePost
            }
            catch(error){
                console.log(error);
                throw error;
            }
        }

        else{
            delete payload.tags;
            Object.assign(post, payload);
            const updatedPost = await this.postRepository.save(post);
            return updatedPost;
        }
    }

    async deletePost(id : number) : Promise<void>{
        await this.postRepository.delete(id);
    }

    async reportPost(id :number, reason : PostReportTypes, userId : number){
        const post = await this.postRepository.findOneOrFail({where : {id}});
        const user = await this.userService.getByID(userId);

        const existingReport = await this.reportRepository.findOne({
            where: { reporter: { id: userId }, reported: { id } },
        });

        if (existingReport) {
            throw new Error("You have already reported this post");
        }

        await this.reportRepository.save({
            reporter : user,
            reported : post,
            reason
        })
    }

    async share(id : number, userId : number) : Promise<void>{
        console.log('share', id, userId);
    }

    async toggleLike(id : number, userId : number){
        const userWhoLiked = await this.userService.getByID(userId);
        const post = await this.postRepository.findOneOrFail({where : {id}, relations : ['user']});

        const like = await this.postLikeRepository.createQueryBuilder('like')
            .where('like.post.id = :id', {id})
            .andWhere('like.user.id = :userId', {userId})
            .getOne();

        const likedPostUser = post.user;

        if(like){
            await this.postLikeRepository.delete(like.id);
            await this.notificationsService.deleteByPostID(post.id, userId);
        }
        else{
            await this.postLikeRepository.save({
                post : {id},
                user : {id : userId}
            })
            await this.notificationsService.createNotification({
                notificationType: NotificationType.LIKED_PHOTO,
                receivedUser: likedPostUser,
                initiatorUser: userWhoLiked,
                post,
            })
        }
    }

    async createComment({postID, replyCommentID, text} : CreateCommentDTO, userId : number) : Promise<CommentEntity>{
        const user = await this.userService.getByID(userId);
        const post = await this.postRepository.findOneOrFail({where : {id : postID}});

        const parentComment = replyCommentID ? await this.commentRepository.findOneOrFail({where : {id : replyCommentID}}) : null;
    
        const newComment = await this.commentRepository.save({
            text,
            post,
            user,
            parentComment
        })

        return newComment
    }

    async updateComment(id : number, text : string) : Promise<CommentEntity>{
        const comment = await this.commentRepository.findOneOrFail({where : {id}, relations : ['post']});
        const newComment = await this.commentRepository.save({
            ...comment,
            text
        })
        return newComment;
    }

    async deleteComment(id : number) : Promise<void>{
        await this.commentRepository.delete(id)
    }

    async toggleCommentLike(id : number, userId : number){
        const user = await this.userService.getByID(userId);
        const CommentLike = await this.commentLikeRepository.createQueryBuilder('like')
            .where('like.comment.id =: id ', {id})
            .andWhere('like.user =: userId', {userId})
            .getOne();

        if(!CommentLike){
            throw new NotFoundException('Comment not found')
        }

        if(CommentLike){
            await this.commentLikeRepository.delete(CommentLike.id);
            await this.notificationsService.deleteByPostID(CommentLike.id, userId);
        }
        else{
            const commentLike = await this.commentLikeRepository.save({
                comment : {id},
                user : {id : userId}
            })
            await this.notificationsService.createNotification({
                notificationType: NotificationType.LIKED_COMMENT,
                receivedUser: commentLike.comment.user,
                initiatorUser: user,
                comment : commentLike.comment,
            });
        }
    }
}
