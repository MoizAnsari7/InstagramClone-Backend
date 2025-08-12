import { Exclude } from "class-transformer";
import { IsEmail } from "class-validator";
import { BeforeInsert, Column, Entity, JoinColumn, OneToMany, OneToOne } from "typeorm";
import * as bcrypt from 'bcryptjs';
import { RecentSearchEntity } from "./recentSearch.entity";
import { FollowingEntity } from "./following.entity";
import { BaseEntity } from "src/common/types/base.entity";
import { FileEntity } from "src/modules/files/entity/file.entity";
import { PostEntity } from "src/modules/posts/entity/post.entity";
import { PostLikeEntity } from "src/modules/posts/entity/postLike.entity";
import { CommentEntity } from "src/modules/posts/entity/comment.entity";
import { CommentLikeEntity } from "src/modules/posts/entity/commentLike.entity";
import { ReportEntity } from "src/modules/posts/entity/report.entity";
import { PostFeedEntity } from "src/modules/posts/entity/postFeed.entity";
import { NotificationEntity } from "src/modules/notifications/entity/notification.entity";

@Entity()
export class UserEntity extends BaseEntity{

    @Column({length : 64})
    name : string

    @Column({unique : true, length : 24})
    username : string

    @Column({unique : true})
    @IsEmail()
    email : string

    @Exclude()
    @Column({nullable : true, length : 128})
    password : string

    @BeforeInsert()
    async hashPassword(): Promise<void> {
        if (this.password) this.password = await bcrypt.hash(this.password, 10);
    }
    
    async validatePassword(password: string): Promise<boolean> {
        if (this.isOAuthAccount) return true;
        return bcrypt.compare(password, this.password);
    }

    @Exclude()
    @Column({nullable : true, select : false})
    hashedRefreshtoken : string


    @Column({default : false})
    isTwoFactorEnable : boolean

    @Exclude()
    @Column({nullable : true, select : false})
    twoFactorSecret : string

    @Column({nullable : true})
    locale : string

    @Column({default : true})
    isActive : boolean

    @Column({default: false})
    isEmailConfirmed : boolean

    @Column({default : false})
    isOAuthAccount: boolean;
    
    @Exclude()
    @Column({ default : false})
    isGoogleAccount : boolean

    @Exclude()
    @Column({default : false})
    isGithubAccount : boolean

    @Column({default : '#b3e6ff'})
    color : string

    @OneToOne(()=> FileEntity, {
        eager : true,
        nullable : true,
        onDelete: 'SET NULL'
    })
    @JoinColumn()
    avatar : FileEntity

    @Column({ length: 1024, nullable: true })
    description: string;
    
    @Column({ length: 512, nullable: true })
    website: string;
    
    @Column({ length: 64, nullable: true })
    phone: string;
    
    @Column({ length: 64, nullable: true })
    gender: string;

    @OneToMany(()=> PostEntity, (p)=> p.user,{
        onUpdate : 'CASCADE',
        onDelete : 'CASCADE'
    })
    posts : PostEntity[];

    @OneToMany(()=> ReportEntity, (r)=> ReportEntity)
    reportedPost : ReportEntity

    @OneToMany(()=> PostLikeEntity, (p)=> p.user, {
        cascade :true
    })
    likedPost : PostLikeEntity[];

    @OneToMany(()=> CommentEntity, (c)=> c.user, {
        cascade : true,
        onUpdate : 'CASCADE',
        onDelete : 'CASCADE'
    })
    commentedPost : CommentEntity[];

    @OneToMany(() => CommentLikeEntity, (cm) => cm.user, {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    })
    likedComments: CommentLikeEntity[];

    @OneToMany(()=> RecentSearchEntity, (r)=>r.user,{
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    })
    recentSearch : RecentSearchEntity[]

    @OneToMany(()=> FollowingEntity, (f)=> f.target,{
        onUpdate : 'CASCADE',
        onDelete : 'CASCADE'
    })
    follower : FollowingEntity[]
    
    @OneToMany(()=> FollowingEntity, (f)=> f.user,{
        onUpdate : 'CASCADE',
        onDelete : 'CASCADE'
    })
    following : FollowingEntity[]
    
    @OneToMany(()=> PostFeedEntity, (pf)=> pf.user,{

    })
    postfeed : PostFeedEntity[]

    @OneToMany(()=>NotificationEntity, (n)=> n.receivedUser, {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    })
    notifications : NotificationEntity[]
}