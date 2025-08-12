import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FileEntity, uploadFileOption } from './entity/file.entity';
import { Repository } from 'typeorm';
import * as sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class FilesService {
  private supabase: SupabaseClient;

  constructor(
    @InjectRepository(FileEntity) private fileEntity: Repository<FileEntity>
  ) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE env variables missing');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async uploadFile(options: uploadFileOption): Promise<FileEntity> {
    const validImageType = ['image/jpg', 'image/jpeg', 'image/png'];
    const validImageSize = 1024 * 1024 * options.imageMaxSizeMB;
    
    if (!validImageType.includes(options.file.mimetype)) {
      throw new HttpException('INVALID_FILE_TYPE', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    if (options.file.size > validImageSize) {
      throw new HttpException('INVALID_FILE_SIZE', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const fileBuffer = await sharp(options.file.buffer)
      .webp({ quality: options.quality })
      .toBuffer();

    const fileExt = '.webp';
    const filename = `${uuidv4()}${fileExt}`;
    const bucket = 'images';

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(filename, fileBuffer, {
        contentType: 'image/webp',
        upsert: false,
      });

    if (error) {
      throw new HttpException(`UPLOAD_FAILED: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const { data: publicUrlData } = this.supabase
      .storage
      .from(bucket)
      .getPublicUrl(data.path);

    const newFile = this.fileEntity.create({
      key: data.path,
      url: publicUrlData.publicUrl,
    });

    return await this.fileEntity.save(newFile);
  }

  async deleteFile(id: number): Promise<void> {
    const file = await this.fileEntity.findOneOrFail({ where: { id } });

    const bucket = 'images';
    await this.supabase.storage
      .from(bucket)
      .remove([file.key]);

    await this.fileEntity.delete(id);
  }
}