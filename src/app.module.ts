import 'dotenv/config';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';
import { BooksModule } from './books/books.module';
import { AuthorsModule } from './authors/authors.module';
import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';
import { WalletsModule } from './wallets/wallets.module';
import{RedisModule} from './redis/redis.module';
import { APP_GUARD } from '@nestjs/core';
import { RedisThrottlerGuard } from './redis/redis-throttler.guard';
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        stores: [createKeyv('redis://localhost:6379')],
      }),
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USERNAME ?? 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME ?? 'book_store',
      autoLoadEntities: true,
      synchronize: false,
    }),
    BooksModule,
    AuthorsModule,
    UsersModule,
    OrdersModule,
    WalletsModule,
    RedisModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: RedisThrottlerGuard,
    },
  ],
})
export class AppModule {}
