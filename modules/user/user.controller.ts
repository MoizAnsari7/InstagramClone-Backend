import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, Request, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { UserEntity } from './entity/user.entity';
import { Public } from '../auth/decorator/public.decorator';
import { RecentSearchEntity } from './entity/recentSearch.entity';
import { UpdateUserDTO } from './dto/user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileEntity } from '../files/entity/file.entity';
import { FollowingEntity } from './entity/following.entity';

@Controller('user')
export class UserController {
  
    constructor(private userService : UserService){}

    @Get()
        async getAll(@Query('search') search: string, @Request() req): Promise<UserEntity[]> {
        return await this.userService.getAll(search, req.user.id);
    }

    @Get('self')
    async getSelf(@Request() req) : Promise<UserEntity>{
        return this.userService.getByID(req.user.id);
    }

    // @Get('suggestions')
    // async getSuggestions(
    //     @Query('page') page: number,
    //     @Query('limit') limit: number,
    //     @Request() req
    // ): Promise<UserSuggestion[]> {
    //     return await this.userService.getSuggestions(page, limit, req.user.id);
    // }

    @Get('recent-search')
    async getRecentSearch(@Request() req){
        return await this.userService.getRecentSearch(req.user.id);
    }

    @Post('recent-search')
    async addRecentSerach(@Body('id') id: number, @Body('type') type : 'tag' | 'user' ,@Request() req) : Promise<RecentSearchEntity>{
        return await this.userService.addRecentSearch(+id, type, req.user.id);
    }

    @Delete('recent-search/:id')
    async removeRecentSearch(@Param('id') id: number): Promise<void> {
        return await this.userService.removeRecentSearch(+id);
    }

    @Public()
    @Get('is-username-taken')
    async isUsernameTaken(@Query('username') username: string) : Promise<boolean>{
        return this.userService.isUsernamTaken(username)
    }

    @Public()
    @Get('is-email-taken')
    async isEmailTaken(@Query('email') email : string) : Promise<boolean>{
        return this.userService.isEmailTaken(email);
    }

    @Post('avatar')
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(FileInterceptor('file'))
    async uploadAvatar(@UploadedFile() file : Express.Multer.File, @Request() req) : Promise<FileEntity>{
        return this.userService.uploadUserImage(file, "avatar", req.user.id);
    }

    @Delete('avtar')
    async deleteAvatar(@Request() req) : Promise<void>{
        return this.userService.deleteUserImage('avatar', req.user.id);
    }

    @Get(':username')
    async getProfileByUsername(@Param('username') username: string, @Request() req): Promise<UserEntity> {
        return await this.userService.getProfileByUsername(username, req.user.id);
    }

    @Patch(':id')
    async updateUser(@Body() body : Partial<UpdateUserDTO>, @Request() req) : Promise<UserEntity>{
        return this.userService.updateUser(req.user.id, body);
    }

    @Post('follow/:id')
    async followUser(@Param('id') id : number , @Request() req): Promise<void>{
        return this.userService.followUser(id, req.user.id);
    }

    @Post('unfollow/:id')
    async unfollowUser(@Param('id') id : number, @Request() req): Promise<void>{
        return this.userService.unfollowUser(id, req.user.id);
    }
}
