import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';

import { UserEntity } from '../user/entity/user.entity';
import { CreateUserDTO, UserTokensInterface } from '../user/dto/user.dto';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth/local-auth.guard';
import { Public } from './decorator/public.decorator';

@Controller('auth')
export class AuthController {

    constructor(private readonly authService : AuthService){}

    @Public()
    @Post('register')
    async registerUser(@Body() payload: CreateUserDTO) : Promise<UserEntity>{
        return await this.authService.register(payload);
    }

    @UseGuards(LocalAuthGuard)
    @Public()
    @Post('login')
    async loginUser(@Request() req) : Promise<UserTokensInterface>{
        return await this.authService.login(req.user);
    }
}
