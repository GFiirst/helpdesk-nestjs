import { Transform, TransformCallback } from 'node:stream';
import { StringDecoder } from 'node:string_decoder';

interface LogError {
  message?: unknown;
  stack?: unknown;
}

export interface StructuredLogRecord {
  context?: unknown;
  err?: LogError | string;
  level?: unknown;
  msg?: unknown;
  name?: unknown;
  req?: unknown;
  sourceContext?: unknown;
  span_id?: unknown;
  spanId?: unknown;
  stack?: unknown;
  time?: unknown;
  trace_id?: unknown;
  traceId?: unknown;
}

const pad = (value: number, length = 2): string => value.toString().padStart(length, '0');

const asString = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') return String(value);
  return '';
};

const formatTimestamp = (value: unknown): string => {
  const date = typeof value === 'number' || typeof value === 'string' ? new Date(value) : new Date();
  const timestamp = Number.isNaN(date.getTime()) ? new Date() : date;
  const offsetMinutes = -timestamp.getTimezoneOffset();
  const offsetSign = offsetMinutes >= 0 ? '+' : '-';
  const absoluteOffset = Math.abs(offsetMinutes);
  const offset = `${offsetSign}${pad(Math.floor(absoluteOffset / 60))}:${pad(absoluteOffset % 60)}`;

  return `${timestamp.getFullYear()}-${pad(timestamp.getMonth() + 1)}-${pad(timestamp.getDate())} ${pad(timestamp.getHours())}:${pad(timestamp.getMinutes())}:${pad(timestamp.getSeconds())}.${pad(timestamp.getMilliseconds(), 3)} ${offset}`;
};

const formatLevel = (value: unknown): string => {
  const level = typeof value === 'number' ? value : 30;
  if (level >= 60) return 'FTL';
  if (level >= 50) return 'ERR';
  if (level >= 40) return 'WRN';
  if (level >= 30) return 'INF';
  if (level >= 20) return 'DBG';
  return 'TRC';
};

const getException = (record: StructuredLogRecord): string => {
  if (typeof record.err === 'string') return record.err;
  if (record.err && typeof record.err === 'object') {
    const stack = asString(record.err.stack);
    if (stack) return stack;
    return asString(record.err.message);
  }
  return asString(record.stack);
};

export const formatSerilogLogRecord = (record: StructuredLogRecord): string => {
  const traceId = asString(record.trace_id) || asString(record.traceId);
  const spanId = asString(record.span_id) || asString(record.spanId);
  const sourceContext =
    asString(record.context) || asString(record.sourceContext) || asString(record.name) || (record.req ? 'HTTP' : 'Application');
  const exception = getException(record).trimEnd();
  const message = asString(record.msg) || (record.err && typeof record.err === 'object' ? asString(record.err.message) : '');
  const line = `[${formatTimestamp(record.time)} ${formatLevel(record.level)}] [${traceId}/${spanId}] ${sourceContext} ${message}`;

  return exception ? `${line}\n${exception}\n` : `${line}\n`;
};

export default function createSerilogLogFormatter(): Transform {
  const decoder = new StringDecoder('utf8');
  let pending = '';

  const formatLine = (stream: Transform, line: string): void => {
    if (!line) return;

    try {
      const record: unknown = JSON.parse(line);
      if (!record || typeof record !== 'object') throw new Error('Log record must be an object');
      stream.push(formatSerilogLogRecord(record as StructuredLogRecord));
    } catch {
      stream.push(`${line}\n`);
    }
  };

  return new Transform({
    transform(chunk: Buffer, _encoding: BufferEncoding, callback: TransformCallback): void {
      pending += decoder.write(chunk);
      const lines = pending.split('\n');
      pending = lines.pop() ?? '';
      lines.forEach((line) => formatLine(this, line));
      callback();
    },
    flush(callback: TransformCallback): void {
      pending += decoder.end();
      formatLine(this, pending);
      callback();
    },
  });
}
