# Helpdesk NestJS API

Backend foundation for a helpdesk platform, built with NestJS 11, TypeORM, and PostgreSQL. It provides cookie-based authentication, refresh-token sessions, role and permission checks, branches, password recovery, database auditing, encrypted file storage utilities, health checks, and versioned technical documentation.

> Current scope: authentication and branch endpoints are available. Roles, permissions, audit logs, scheduling, pagination, and encrypted file storage are reusable infrastructure and do not expose dedicated public endpoints yet.

## Features

- JWT access and refresh tokens delivered only through HttpOnly cookies.
- Configurable token expiration and a five-session default limit.
- Refresh tokens stored as SHA-256 hashes and compared in constant time.
- Password recovery by email with single-use reset tokens.
- BCrypt password hashing, AES-256-GCM encrypted email addresses, and keyed email hashes for lookup and uniqueness.
- CASL-based role and permission checks.
- Automatic, sanitized audit logs for database mutations.
- Client IPs stored in audit logs only as SHA-256 hashes.
- AES-256-GCM envelope encryption for stored files.
- File validation by size, extension, MIME type, and byte signature.
- Global validation, error responses, rate limiting, CORS, Swagger, and database-aware health checks.
- Structured Pino request and application logs with daily file rotation, retention, redaction, and request IDs.
- Optional OpenTelemetry export for structured logs, traces, and metrics over OTLP.
- Validated environment configuration and versioned TypeORM migrations.
- Unit tests, Docker assets, CI workflow, OpenAPI contract, and DBML schema.

## Technology

- Node.js 22.15+ and NestJS 11
- TypeScript, TypeORM, and PostgreSQL
- JWT, BCrypt, CASL, Nodemailer, Pino, OpenTelemetry, and Node.js Crypto
- Jest, Supertest, Swagger/OpenAPI, Docker, and GitHub Actions

## Authentication model

| Cookie          | Purpose                          | Default lifetime |
| --------------- | -------------------------------- | ---------------: |
| `access_token`  | Authenticates protected requests |       15 minutes |
| `refresh_token` | Renews the access token          |          30 days |

Both cookies use `HttpOnly`, `SameSite=Strict`, and `Path=/`. Set `COOKIE_SECURE=true` in production. Browser clients must include credentials, for example `credentials: "include"` with `fetch`.

Tokens are not returned in response bodies. A successful login returns only the access-token expiration and basic user information.

## Requirements

- Node.js 22+
- npm 10+
- PostgreSQL 16+
- Docker with Compose for the container workflow

## Local configuration

Copy the example file and replace all placeholder secrets:

```bash
cp .env.example .env
```

Important settings:

```env
NODE_ENV=development
PORT=4321

LOG_LEVEL=info
LOG_PATH=logs
LOG_RETENTION_DAYS=15
LOG_FILE_ENABLED=true

OTEL_ENABLED=false
OTEL_SERVICE_NAME=helpdesk-nestjs
OTEL_SERVICE_VERSION=0.0.1
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
OTEL_EXPORTER_OTLP_PROTOCOL=grpc
OTEL_METRIC_EXPORT_INTERVAL_MS=10000

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=change-me
DB_NAME=helpdesk
DB_SYNC=false

JWT_SECRET=use-a-long-random-access-secret
JWT_REFRESH_SECRET=use-a-different-long-random-refresh-secret
JWT_RESET_SECRET=use-a-different-long-random-reset-secret
JWT_ACCESS_EXPIRATION_MINUTES=15
JWT_REFRESH_EXPIRATION_DAYS=30
JWT_RESET_EXPIRATION_MINUTES=15

FIELD_ENCRYPTION_KEY=<32-byte-key-in-base64>

ORIGIN=http://localhost:3000
COOKIE_SECURE=false
FRONTEND_URL=http://localhost:3000

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=
MAIL_PASS=

FILE_PATH=uploads
FILE_MAX_BYTES=10485760
FILE_ENCRYPTION_KEK=
```

Generate both 32-byte encryption keys with:

```bash
openssl rand -base64 32
```

Do not rotate `FIELD_ENCRYPTION_KEY` or `FILE_ENCRYPTION_KEK` without migrating the encrypted data. Losing `FIELD_ENCRYPTION_KEY` makes email addresses unreadable and changes their lookup hashes. In production, all JWT secrets must contain at least 32 characters and the reset secret must differ from the access and refresh secrets.

## Install and run

```bash
npm ci
npm run build
npm run typeorm:run
npm run generate:roles
npm run generate:branches
npm run permissions:sync
npm run generate:users
npm run start:dev
```

The API listens on `http://localhost:4321` by default.

- Swagger UI: `/docs` in development
- Health check: `/health`

The seed scripts are intentionally separate so operators can control when startup data changes. Run branches and roles before the admin-user seed.

## Database migrations

Create a migration after changing entities:

```bash
npm run migration:generate -- src/database/migrations/DescribeChange
```

Apply committed migrations:

```bash
npm run typeorm:run
```

`DB_SYNC` should remain `false` outside disposable local databases.

## API endpoints

| Method | Route                   | Authentication                     | Description                                  |
| ------ | ----------------------- | ---------------------------------- | -------------------------------------------- |
| `POST` | `/auth/sign-up`         | `user.create` permission           | Create a user                                |
| `POST` | `/auth/login`           | Public                             | Authenticate and create a session            |
| `POST` | `/auth/refresh`         | Refresh cookie                     | Renew the access token                       |
| `POST` | `/auth/logout`          | Public                             | Revoke the current session and clear cookies |
| `GET`  | `/auth/validate`        | Access cookie                      | Return the authenticated user                |
| `POST` | `/auth/forgot-password` | Public                             | Request password recovery                    |
| `POST` | `/auth/reset-password`  | Public                             | Reset a password and revoke active sessions  |
| `POST` | `/branches/create`      | Manage permission and admin branch | Create a branch                              |
| `GET`  | `/branches`             | Public                             | List non-administrative branches             |
| `GET`  | `/branches/all`         | Manage permission and admin branch | List every branch                            |
| `GET`  | `/health`               | Public                             | Check API and database availability          |

Public authentication routes are limited to five requests per five minutes. The global limiter allows five requests per minute by default.

### Login example

```bash
curl -c cookies.txt \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"strong-password"}' \
  http://localhost:4321/auth/login

curl -b cookies.txt http://localhost:4321/auth/validate

curl -b cookies.txt -c cookies.txt -X POST \
  http://localhost:4321/auth/refresh
```

### Password recovery

`POST /auth/forgot-password` uses a generic success response when email delivery is available, whether or not the account exists. The reset token is tied to the current password hash; after one successful use, the same token no longer works. Resetting a password revokes all active refresh tokens.

## Roles and permissions

The seed scripts create `admin`, `manager`, `agent`, and `user` roles. CASL policies are declared in `src/permissions/permissions.map.ts`. The `manage.manage` permission bypasses endpoint-specific checks.

All new endpoints are protected by default. Apply `@Public()` only when anonymous access is intentional, and use `@CheckPolicies(...)` for authorization rules.

## Auditing

TypeORM inserts, updates, and deletes are written to `audit_log`. Passwords, tokens, secrets, authorization data, cookies, credentials, hashes, encrypted values, and keys are recursively redacted. Cyclic structures are handled safely. Request IP addresses are hashed before persistence.

Apply the migrations before enabling writes after upgrading to this version.

## Logs

Pino replaces the default NestJS logger while using the same readable output convention as the base ASP.NET application: `[timestamp level] [trace/span] context message`. When `LOG_FILE_ENABLED=true`, events are written as text under `LOG_PATH` in daily `log.<date>.<number>.txt` files. At most `LOG_RETENTION_DAYS` matching files are retained, including files created before an application restart. Informational NestJS bootstrap events are suppressed, exception stacks are written below their messages, HTTP requests receive an `x-request-id`, and `/health` is excluded from automatic request logs.

Authorization headers, cookies, passwords, tokens, plaintext request emails, encrypted emails, and email hashes are redacted when those properties are present in a log record. Application code must still avoid logging whole DTOs or other personal data.

## OpenTelemetry

Set `OTEL_ENABLED=true` to send Pino logs, traces, and metrics to any OTLP-compatible collector or backend. The instrumentation covers inbound and outbound HTTP, NestJS, PostgreSQL, and the Node.js runtime. `/health` is omitted from traces to reduce noise, and request-scoped Pino events include `trace_id` and `span_id` for correlation.

Both `grpc` and `http/protobuf` are accepted through `OTEL_EXPORTER_OTLP_PROTOCOL`. Use port `4317` for gRPC or `4318` for HTTP/protobuf unless your collector specifies another endpoint. Standard `OTEL_EXPORTER_OTLP_HEADERS` can be used when the remote backend requires authentication.

No Grafana, collector, or telemetry backend is embedded in this repository. Point `OTEL_EXPORTER_OTLP_ENDPOINT` to your existing OpenTelemetry Collector, Grafana Alloy, Grafana Cloud, or another compatible service.

## Sensitive database fields

Credential email addresses are normalized and encrypted with AES-256-GCM before persistence. A separate HMAC-SHA-256 value supports indexed login, uniqueness checks, and password recovery without decrypting every row. Plaintext email addresses are only produced at authenticated response and email-delivery boundaries, and they are not included in JWT claims.

## Encrypted file storage

`FileStorageService` and `FileValidatorService` are exported by `UploadModule`. Supported formats are PDF, PNG, JPG/JPEG, GIF, WebP, DOCX, XLSX, and TXT.

Each file receives a random data encryption key. File data and that key are authenticated with AES-256-GCM; the data key is encrypted by `FILE_ENCRYPTION_KEK`. Stored filenames are random UUIDs and files are created with restrictive permissions.

No upload controller is included. A feature that exposes uploads must add authorization, ownership checks, content-disposition handling, and request-level Multer limits.

## Tests

```bash
npm test
npm run test:cov
npm run test:e2e
```

The unit suite covers configuration validation, audit sanitization, file signatures, and authenticated encryption. See [TESTS.md](TESTS.md) for test architecture and troubleshooting.

## Docker

```bash
docker compose up --build
docker compose down
```

Compose exposes the API on port `4321` and PostgreSQL on host port `5433`. See [DOCKER.md](DOCKER.md) for configuration and operational notes.

## Technical documentation

- [OpenAPI contract](docs/openapi.yaml)
- [Database diagram](docs/helpdesk.dbml)
- [Testing guide](TESTS.md)
- [Docker guide](DOCKER.md)

## Security notes

- Keep `.env`, SMTP credentials, JWT secrets, and encryption keys outside version control.
- Use HTTPS and `COOKIE_SECURE=true` in production.
- Restrict trusted proxies at the infrastructure layer; the application trusts one proxy hop.
- Review `npm audit` findings in the context of production dependency paths before deployment.
- Back up the database and file KEK together; losing the KEK makes encrypted files unrecoverable.
