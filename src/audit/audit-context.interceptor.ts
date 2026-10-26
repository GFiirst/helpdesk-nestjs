import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { AsyncLocalStorage } from 'node:async_hooks';
import { defer, Observable } from 'rxjs';
import { AuthRequest } from '../auth/interfaces/auth-request.interface';

export interface AuditContext {
  actorId?: string;
  ipHash?: string;
}

@Injectable()
export class AuditContextInterceptor implements NestInterceptor {
  constructor(private readonly storage: AsyncLocalStorage<AuditContext>) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const forwardedFor = request.headers['x-forwarded-for'];
    const ip =
      (typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0]?.trim()
        : undefined) ??
      request.socket.remoteAddress ??
      undefined;
    const store: AuditContext = {
      actorId: request.user?.id,
      ipHash: ip ? createHash('sha256').update(ip).digest('hex') : undefined,
    };

    return defer(() => this.storage.run(store, () => next.handle()));
  }
}
