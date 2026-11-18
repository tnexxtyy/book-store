import {Injectable,OnModuleDestroy,OnModuleInit}from '@nestjs/common';
import{createClient,RedisClientType}from 'redis';
@Injectable()
export class RedisService implements OnModuleInit,OnModuleDestroy {
  private readonly client: RedisClientType = createClient({
    url:'redis://localhost:6379',
  });
  async onModuleInit():Promise<void>{
    await this.client.connect();
  }
  async onModuleDestroy():Promise<void>{
    if(this.client.isOpen){
      await this.client.quit();
    }
  }
  async increment(key:string):Promise<number>{
    return this.client.incr(key);
  }
  async setExpiration(key:string,seconds:number):Promise<void>{
    await this.client.expire(key,seconds);
  }
  async getTtl(key:string):Promise<number>{
    return this.client.ttl(key);
  }
  async acquireLock(
    key:string,
    token:string,
    seconds:number,
  ):Promise<boolean>{
    const result = await this.client.set(key,token,{
      NX:true,
      EX:seconds,
    });
    return result === 'OK'
  }
  async releaseLock(key:string,token:string):Promise<boolean>{
    const script =`
    if redis.call('GET',KEYS[1])== ARGV[1] then 
    return redis.call('DEL',KEYS[1])
    else 
    return 0
    end
    `;

    const result =await this.client.eval(script,{
      keys:[key],
      arguments:[token],
    });
    return result === 1;
  }

}



















