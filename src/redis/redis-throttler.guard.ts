import{CanActivate,ExecutionContext,Injectable,HttpException,HttpStatus}from '@nestjs/common';
import{RedisService}from './redis.service';
@Injectable()
export class RedisThrottlerGuard implements CanActivate{
  constructor(private readonly redisService:RedisService){}

  async canActivate(context:ExecutionContext):Promise<boolean>{
    const request =context.switchToHttp().getRequest();
    const ip=request.ip;
    const key =`rate-limit:${ip}`;
    const count =await this.redisService.increment(key);
    if(count === 1){
      await this.redisService.setExpiration(key,60);
    }
    if (count>10){
      throw new HttpException(
        'To Many Requests',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }
}
