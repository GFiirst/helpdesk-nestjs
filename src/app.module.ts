import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthGuard } from './auth/guards/auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { PoliciesGuard } from './auth/casl/guards/policies.guard';
import { AuthModule } from './auth/auth.module';
import { CaslModule } from './auth/casl/casl.module';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from './users/users.module';
import { AsyncLocalStorage } from 'async_hooks';
import 'dotenv/config';
import { entities } from './database/entities';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: process.env.DB_TYPE! as 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT!,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: entities,
      synchronize: false,
    }),
    AuthModule,
    CaslModule,
    UsersModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      global: true
    })
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard
    },
    {
      provide: APP_GUARD,
      useClass: PoliciesGuard
    },
    {
      provide: AsyncLocalStorage,
      useValue: new AsyncLocalStorage()
    },
  ],
})
export class AppModule {}
