import { HttpException, HttpStatus, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt'

import { CreateUserDTO, UserJwtPayload, UserTokensInterface, UserValidationDTO } from '../user/dto/user.dto';
import { UserEntity } from '../user/entity/user.entity';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {

    constructor(
        private readonly userService : UserService,
        private readonly jwtService : JwtService
    ){}

    async validateUser(data : UserValidationDTO) : Promise<UserEntity>{
        const user = await this.userService.getUserByEmail(data.email)
        if(!user){
            throw new HttpException("USER_NOT_FOUND", HttpStatus.UNAUTHORIZED)
        }

        const isPasswordMatch = await user.validatePassword(data.password)
        if(isPasswordMatch){
            return user;
        }
        else throw new HttpException('USER_INVALID_CREDENTIALS', HttpStatus.UNAUTHORIZED);
    }

    async register(payload : CreateUserDTO) : Promise<UserEntity>{
        const user = await this.userService.createUser(payload);
        return user;
    }

    async login(user : UserEntity, is2FAEnabled=false) : Promise<UserTokensInterface>{
        const dbUser = await this.userService.getByID(user.id);
        if(!dbUser){
            throw new NotFoundException("User not found");
        }

        if (dbUser.isTwoFactorEnable && !is2FAEnabled) {
            throw new UnauthorizedException("2FA is required");
        }
        const payload : UserJwtPayload = {id : user.id , email : user.email, is2FAEnabled : is2FAEnabled}

        const accessToken = this.jwtService.sign(payload,{secret: process.env.JWT_SECRET});
        const refreshToken =  this.jwtService.sign(payload,{
            expiresIn : process.env.JWT_REFRESH_EXPIRES_IN
        });

        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
        await this.userService.setUpdateRefreshToken(dbUser.id, hashedRefreshToken)

        return {
            user : dbUser,
            accessToken,
            refreshToken,
        };
    }
    
}