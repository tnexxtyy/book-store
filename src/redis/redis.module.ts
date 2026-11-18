import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisThrottlerGuard } from './redis-throttler.guard';

@Module({
  providers: [RedisService, RedisThrottlerGuard],
  exports: [RedisService, RedisThrottlerGuard],
})
export class RedisModule {}
