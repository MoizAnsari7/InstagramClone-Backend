import { BaseEntity } from "src/common/types/base.entity";
import { Column, Entity } from "typeorm";


export interface uploadFileOption{
    file : Express.Multer.File,
    quality : number,
    imageMaxSizeMB : number,
    type : 'image' | 'video'
}

@Entity()
export class FileEntity extends BaseEntity{

    @Column()
    url : string

    @Column()
    key : string
}