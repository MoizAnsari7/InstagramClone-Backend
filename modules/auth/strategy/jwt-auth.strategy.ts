import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";
import { UserJwtPayload } from "src/modules/user/dto/user.dto";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){
    constructor(){
        super({
            jwtFromRequest : ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration : false,
            secretOrKey : process.env.JWT_SECRET as string
        })
    }

    async validate(payload : UserJwtPayload) : Promise<UserJwtPayload>{
        return payload
    }
}