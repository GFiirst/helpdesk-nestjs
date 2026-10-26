# Automated Tests

The project uses Jest for unit tests and Supertest for end-to-end HTTP tests.

## Commands

```bash
npm test
npm run test:watch
npm run test:cov
npm run test:e2e
```

## Unit test coverage

Tests under `src/**/*.spec.ts` currently verify:

- environment defaults, type conversion, and unsafe secret rejection;
- recursive audit-log redaction and circular-reference handling;
- allowed file signatures and spoofed-content rejection;
- AES-256-GCM encryption round trips and tamper detection.

Unit tests do not require PostgreSQL or SMTP.

## End-to-end tests

Tests under `test/**/*.e2e-spec.ts` start the full NestJS application and require PostgreSQL. Set the application environment, apply migrations, and then run:

```bash
npm run build
npm run typeorm:run
npm run test:e2e
```

The CI workflow provisions a PostgreSQL service and performs these steps automatically.

## Isolation guidelines

- Create unique emails and entity names per test.
- Delete test-owned data in `afterEach` or roll back an explicit transaction.
- Never load the developer `.env` into tests that mutate shared infrastructure.
- Mock `EmailService` in authentication unit tests; do not send real messages.
- Use a temporary `FILE_PATH` and a random 32-byte Base64 KEK for storage tests.

## Coverage

```bash
npm run test:cov
```

HTML output is written to `coverage/lcov-report/index.html`. Prioritize security boundaries, invalid payloads, session revocation, authorization failures, transaction rollback, and encrypted-file corruption over line coverage alone.

## Troubleshooting

- `ECONNREFUSED` during e2e tests: verify PostgreSQL is running and the `DB_*` settings target it.
- Missing relation or table: build and run TypeORM migrations before the suite.
- Configuration error during bootstrap: compare the test environment with `.env.example`; access and refresh JWT secrets must differ.
- Open handles after tests: call `await app.close()` in `afterAll`.
