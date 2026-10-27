# Docker Guide

## Start the stack

Configure `.env` first, then run:

```bash
docker compose up --build -d
docker compose logs -f api
```

The API is published on `http://localhost:4321`; PostgreSQL is published on host port `5433`. Inside the Compose network, the API connects to `database:5432`.

Apply migrations and seed required records:

```bash
docker compose exec api node ./node_modules/typeorm/cli.js migration:run -d ./dist/database/data-source.js
docker compose exec api npm run generate:roles
docker compose exec api npm run generate:branches
docker compose exec api npm run permissions:sync
docker compose exec api npm run generate:users
```

## Production settings

- Replace every example secret.
- Set `COOKIE_SECURE=true` behind HTTPS.
- Do not publish the database port unless external access is required.
- Store `FILE_ENCRYPTION_KEK` in a secrets manager.
- When telemetry is enabled, configure `OTEL_EXPORTER_OTLP_ENDPOINT` with an OTLP collector reachable from the API container.
- Mount uploads, logs, and PostgreSQL data on backed-up persistent storage.
- Terminate TLS and restrict trusted proxy traffic at the reverse proxy or load balancer.

The image runs as the unprivileged `node` user. Ensure a bind-mounted upload directory is writable by UID 1000, or use the named volume included in the Compose file.

## Operations

```bash
docker compose ps
docker compose logs --tail=200 api
docker compose exec api ls -lah /app/logs
docker compose restart api
docker compose down
```

The API writes structured logs to stdout and rotating files in the `logs` volume. `docker compose down -v` permanently removes database, upload, and log volumes. Use it only for disposable environments.
