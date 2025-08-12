import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { UserEntity } from '../entity/user.entity';

export interface UserValidationDTO {
  readonly email: string;
  readonly password: string;
}
export interface UserJwtPayload {
  readonly id: number;
  readonly email: string;
  readonly is2FAEnabled: boolean;
}

export interface UserTokensInterface {
  readonly user?: UserEntity;
  readonly accessToken: string;
  readonly refreshToken: string;
}

export class CreateUserDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  name: string;

  @IsNotEmpty()
  @MaxLength(24)
  username: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;
}

export class UpdateUserDTO {
  @IsString()
  @MaxLength(64)
  username?: string;
  @IsString()
  @MaxLength(24)
  name?: string;
  @IsString()
  @IsEmail()
  email?: string;

  @IsString()
  @MaxLength(1024)
  description?: string;
  @IsString()
  @MaxLength(512)
  website?: string;
  @IsString()
  @MaxLength(64)
  phone?: string;
  @IsString()
  @MaxLength(64)
  gender?: string;
}

export class CreateUserGithubDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  name: string;

  @IsNotEmpty()
  @MaxLength(24)
  username: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  location: string;

  @IsString()
  company: string;
}