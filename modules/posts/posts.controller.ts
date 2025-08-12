import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UploadedFile, UseInterceptors } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostEntity } from './entity/post.entity';
import { TagEntity } from './entity/tag.entity';
import { CommentEntity } from './entity/comment.entity';
import { PostLikeEntity } from './entity/postLike.entity';
import { UserEntity } from '../user/entity/user.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateCommentDTO, CreatePostDTO, UpdatePostDTO } from './dto/post.dto';
import { PostReportTypes } from './entity/report.entity';
import { Pagination } from 'nestjs-typeorm-paginate';

@Controller('posts')
export class PostsController {
    constructor(private readonly postService : PostsService){}

    @Get()
    async getAll(
        @Query('page') page: number,
        @Query('limit') limit: number,
        @Query('tab') tab = '',
        @Request() req
    ): Promise<Pagination<PostEntity>>{
        return await this.postService.getAll({ page, limit }, tab, req.user.id);
    }

    @Get('tags')
    async getTags(@Query('search') search : string) : Promise<TagEntity[]>{
        return await this.postService.getTags(search);
    }

    @Get(':id')
    async getPostById(@Param('id') id : number) : Promise<PostEntity>{
        return await this.postService.getPostById(id)
    }

    @Get('comments/:id')
    async getComments(@Param('id') id:string, @Request() req) : Promise<Partial<CommentEntity>[]>{
        return await this.postService.getComments(+id, req.user.id)
    }

    @Get('likes/:id')
    async getLikes(@Param('id') id:number, @Request() req) : Promise<Partial<UserEntity>[]>{
        return await this.postService.getLikes(id,req.user.id);
    }

    @Get('tags/:name')
    async getTagByName(@Param('name') name : string) : Promise<TagEntity>{
        return await this.postService.getTagByName(name);
    }

    @UseInterceptors(FileInterceptor('file'))
    @Post()
    async createPost(
        @UploadedFile() file : Express.Multer.File,
        @Body() payload : CreatePostDTO,
        @Request() req
    ) : Promise<PostEntity>{
        return await this.postService.createPost(file, payload, req.user.id)
    }

    @Patch(':id')
    async updatePost(@Param('id') id : number, @Body() payload : Partial<UpdatePostDTO>) : Promise<PostEntity>{
        return await this.postService.updatePost(+id , payload);
    }

    @Delete(':id')
    async deletePost(@Param('id') id : number) : Promise<void>{
        return await this.postService.deletePost(+id);
    }

    @Post('report/:id')
    async reportPost(@Param('id') id:number, @Body('reasonID') reasonID: PostReportTypes, @Request() req){
        return await this.postService.reportPost(+id,reasonID, req.user.id);
    }

    @Post('/share/:id')
    async share(@Param('id') id : number, @Request() req) : Promise<void>{
        return await this.share(+id, req.user.id);
    }

    @Post('like/:id')
    async toggleLike(@Param('id') id:number, @Request() req){
        return await this.postService.toggleLike(+id, req.user.id)
    }

    @Post('comment')
    async createComment(@Body() payload : CreateCommentDTO, @Request() req){
        return await this.postService.createComment(payload, req.user.id);
    }

    @Patch('comment/:id')
    async updateComment(@Param('id') id : number, @Body('text') text:string){
        return await this.postService.updateComment(+id, text);
    }

    @Delete('comment/:id')
    async deleteComment(@Param('id') id : number) : Promise<void>{
        return await this.postService.deleteComment(+id)
    }

    @Post('comment/like/:id')
    async toggleCommentLike(@Param('id')  id : number, @Request() req){
        return await this.postService.toggleCommentLike(+id, req.user.id);
    }
}
