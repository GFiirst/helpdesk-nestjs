import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import { DataSource, EntitySubscriberInterface, EventSubscriber, InsertEvent, RemoveEvent, UpdateEvent } from 'typeorm';
import { AuditAction } from './audit-action.enum';
import { AuditContext } from './audit-context.interceptor';
import { AuditLog } from './audit-log.entity';
import { AuditValueSanitizer } from './audit-value-sanitizer';

@Injectable()
@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface {
  constructor(
    dataSource: DataSource,
    private readonly storage: AsyncLocalStorage<AuditContext>,
  ) {
    dataSource.subscribers.push(this);
  }

  async afterInsert(event: InsertEvent<unknown>): Promise<void> {
    await this.write(event, AuditAction.CREATE, this.entityId(event.entity), event.entity);
  }

  async afterUpdate(event: UpdateEvent<unknown>): Promise<void> {
    const changes = Object.fromEntries(
      event.updatedColumns.map((column) => [column.propertyName, this.propertyValue(event.entity, column.propertyName)]),
    );
    await this.write(event, AuditAction.UPDATE, this.entityId(event.entity ?? event.databaseEntity), changes);
  }

  async afterRemove(event: RemoveEvent<unknown>): Promise<void> {
    await this.write(event, AuditAction.DELETE, String(event.entityId ?? this.entityId(event.databaseEntity) ?? ''), null);
  }

  private async write(
    event: InsertEvent<unknown> | UpdateEvent<unknown> | RemoveEvent<unknown>,
    action: AuditAction,
    entityId: string | undefined,
    changes: unknown,
  ): Promise<void> {
    if (event.metadata.target === AuditLog) {
      return;
    }

    const context = this.storage.getStore();
    const auditLog = new AuditLog();
    auditLog.action = action;
    auditLog.entityName = event.metadata.name;
    auditLog.entityId = entityId || null;
    auditLog.actorId = context?.actorId ?? null;
    auditLog.ipHash = context?.ipHash ?? null;
    auditLog.changes = (AuditValueSanitizer.sanitize(changes) ?? null) as Record<string, unknown> | null;

    await event.manager.save(AuditLog, auditLog);
  }

  private entityId(entity: unknown): string | undefined {
    if (!entity || typeof entity !== 'object' || !('id' in entity)) {
      return undefined;
    }

    const id = entity.id;
    return typeof id === 'string' || typeof id === 'number' ? String(id) : undefined;
  }

  private propertyValue(entity: unknown, propertyName: string): unknown {
    if (!entity || typeof entity !== 'object') {
      return undefined;
    }

    return (entity as Record<string, unknown>)[propertyName];
  }
}
