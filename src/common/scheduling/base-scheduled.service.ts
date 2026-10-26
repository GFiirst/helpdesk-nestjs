import {
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';

export abstract class BaseScheduledService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  protected abstract readonly intervalMs: number;
  protected abstract readonly taskName: string;
  private readonly logger = new Logger(this.constructor.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  onApplicationBootstrap(): void {
    this.scheduleNextRun();
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  protected abstract execute(): Promise<void>;

  private scheduleNextRun(): void {
    if (!Number.isFinite(this.intervalMs) || this.intervalMs <= 0) {
      throw new Error(`${this.taskName} interval must be greater than zero`);
    }

    this.timer = setTimeout(() => void this.run(), this.intervalMs);
    this.timer.unref();
  }

  private async run(): Promise<void> {
    if (this.running) {
      this.logger.warn(
        `${this.taskName} skipped because it is already running`,
      );
      this.scheduleNextRun();
      return;
    }

    this.running = true;
    try {
      await this.execute();
    } catch (error) {
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`${this.taskName} failed`, stack);
    } finally {
      this.running = false;
      this.scheduleNextRun();
    }
  }
}
