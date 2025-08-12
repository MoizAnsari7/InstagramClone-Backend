import { BaseEntity } from "src/common/types/base.entity";
import { UserEntity } from "src/modules/user/entity/user.entity";
import { AfterLoad, Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, OneToOne } from "typeorm";
import { PostLikeEntity } from "./postLike.entity";
import { CommentEntity } from "./comment.entity";
import { FileEntity } from "src/modules/files/entity/file.entity";
import { ReportEntity } from "./report.entity";
import { TagEntity } from "./tag.entity";
import { PostFeedEntity } from "./postFeed.entity";

@Entity()
export class PostEntity extends BaseEntity{
    @Column({nullable : true})
    description : string

    @ManyToMany(()=> TagEntity, (t)=> t.posts,{
        cascade: true,
    })  
    @JoinTable()
    tags : TagEntity[]

    @ManyToOne(()=> UserEntity, (u)=> u.posts, {
        cascade : true,
        eager : true
    })
    user : UserEntity
    
    @OneToMany(()=> PostLikeEntity, (p)=>p.post, {
        eager: true,
        cascade : true
    })
    like : PostLikeEntity[];

    @OneToMany(()=> CommentEntity, (c)=> c.post,{
        cascade : true
    })
    comment : CommentEntity[]

    @OneToMany(()=> ReportEntity, (r)=> r.reported, {

    })
    reports : ReportEntity[]

    @Column({ type: 'boolean', default: false })
    isVideo: boolean;

    @OneToOne(()=> FileEntity,{
        cascade : true
    })
    @JoinColumn()
    file : FileEntity;

    @OneToMany(() => PostFeedEntity, (pf) => pf.post, {
        cascade: true,
    })
    feeds: PostFeedEntity[];

    isViewerLiked: boolean;
    isViewerSaved: boolean;
    isViewerInPhoto: boolean;

}