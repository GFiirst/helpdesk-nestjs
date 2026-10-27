import { formatSerilogLogRecord } from './serilog-log-formatter.transport';

describe('formatSerilogLogRecord', () => {
  it('formats structured logs using the Serilog application template', () => {
    const result = formatSerilogLogRecord({
      level: 30,
      time: '2026-10-27T12:34:56.789Z',
      context: 'AuthService',
      msg: 'User logged in',
      trace_id: 'trace-123',
      span_id: 'span-456',
    });

    expect(result).toMatch(
      /^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.789 [+-]\d{2}:\d{2} INF\] \[trace-123\/span-456\] AuthService User logged in\n$/,
    );
    expect(result).not.toContain('"level"');
  });

  it('writes exception details on the following line', () => {
    const result = formatSerilogLogRecord({
      level: 50,
      context: 'HttpExceptionFilter',
      msg: 'GET /users failed',
      err: {
        message: 'Database unavailable',
        stack: 'Error: Database unavailable\n    at UsersService.findAll',
      },
    });

    expect(result).toContain('ERR] [/] HttpExceptionFilter GET /users failed\nError: Database unavailable\n    at UsersService.findAll\n');
  });
});
