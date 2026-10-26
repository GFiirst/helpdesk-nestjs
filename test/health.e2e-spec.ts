import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

interface HealthResponse {
  status: string;
  database: string;
  timestamp: string;
}

describe('Health endpoint (e2e)', () => {
  let app: INestApplication | undefined;
  let httpServer: App;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    httpServer = app.getHttpServer() as App;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('reports API and database availability', async () => {
    const response = await request(httpServer).get('/health').expect(200);
    const body = response.body as HealthResponse;

    expect(body).toMatchObject({ status: 'ok', database: 'up' });
    expect(body.timestamp).toEqual(expect.any(String));
  });
});
