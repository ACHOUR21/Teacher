import { ConsoleLogger, Injectable, LogLevel, Optional, Scope } from '@nestjs/common';

import { correlationStorage } from './correlation.middleware';

interface StructuredLogEntry {
  level: string;
  context: string | undefined;
  correlationId: string;
  tenantId: string;
  message: string;
  timestamp: string;
  stack?: string;
}

@Injectable({ scope: Scope.TRANSIENT })
export class StructuredLoggerService extends ConsoleLogger {
  constructor(@Optional() context?: string) {
    super(context ?? '');
  }

  private buildEntry(level: LogLevel, message: unknown, context?: string): StructuredLogEntry {
    const store = correlationStorage.getStore();
    return {
      level,
      context: context ?? this.context,
      correlationId: store?.correlationId ?? 'no-correlation-id',
      tenantId: store?.tenantId ?? 'system',
      message: typeof message === 'string' ? message : JSON.stringify(message),
      timestamp: new Date().toISOString(),
    };
  }

  private write(entry: StructuredLogEntry): void {
    process.stdout.write(JSON.stringify(entry) + '\n');
  }

  override log(message: unknown, context?: string): void {
    this.write(this.buildEntry('log', message, context));
  }

  override error(message: unknown, stackOrContext?: string, context?: string): void {
    const entry = this.buildEntry('error', message, context ?? stackOrContext);
    // If stackOrContext looks like a stack trace, attach it
    if (stackOrContext && stackOrContext.includes('\n')) {
      entry.stack = stackOrContext;
    }
    this.write(entry);
  }

  override warn(message: unknown, context?: string): void {
    this.write(this.buildEntry('warn', message, context));
  }

  override debug(message: unknown, context?: string): void {
    this.write(this.buildEntry('debug', message, context));
  }

  override verbose(message: unknown, context?: string): void {
    this.write(this.buildEntry('verbose', message, context));
  }
}
