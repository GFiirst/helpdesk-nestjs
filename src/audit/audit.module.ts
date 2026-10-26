import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AsyncLocalStorage } from 'node:async_hooks';
import {
  AuditContext,
  AuditContextInterceptor,
} from './audit-context.interceptor';
import { AuditSubscriber } from './audit.subscriber';

@Module({
  providers: [
    {
      provide: AsyncLocalStorage,
      useValue: new AsyncLocalStorage<AuditContext>(),
    },
    AuditSubscriber,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditContextInterceptor,
    },
  ],
})
export class AuditModule {}
