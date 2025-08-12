import { Column, Entity, ManyToOne } from "typeorm";
import { PostEntity } from "./post.entity";
import { UserEntity } from "src/modules/user/entity/user.entity";
import { BaseEntity } from "src/common/types/base.entity";


export enum PostReportTypes {
  SPAM = 'SPAM',
  NUDITY = 'NUDITY',
  HATE = 'HATE',
  BULLING = 'BULLING',
  AUTHOR_RIGHTS = 'AUTHOR_RIGHTS',
  SUICIDE = 'SUICIDE',
  SCAM = 'SCAM',
  FALSE_INFORMATION = 'FALSE_INFORMATION',
  DONT_LIKE = 'DONT_LIKE',
}

@Entity()
export class ReportEntity extends BaseEntity{
 
    @ManyToOne(()=> PostEntity, (p)=> p.reports)
    reported : PostEntity;
    
    @ManyToOne(()=> UserEntity, (u)=> u.reportedPost)
    reporter : UserEntity;

    @Column({type : 'enum', enum : PostReportTypes})
    reason : PostReportTypes
}