# Album Backend

Backend API for saving authenticated World Cup sticker album progress.

The frontend owns the sticker catalog and authentication UI. This service validates Supabase access tokens, stores per-user album progress in PostgreSQL, and exposes a small JSON API under `/api`.

## Quick start

```bash
npm install
cp .env.example .env
npm run dev
```

Health check:

```bash
curl http://localhost:3000/api/health
```

## Environment variables

| Variable | Required | Description |
|---|---:|---|
| `PORT` | No | Local HTTP port. Defaults to `3000`. |
| `HOST` | No | Local bind host. Defaults to `0.0.0.0`. |
| `CORS_ORIGINS` | Yes in production | Comma-separated frontend origins allowed by CORS. |
| `SUPABASE_URL` | Yes | Supabase project URL. |
| `SUPABASE_ANON_KEY` | Yes | Public anon key used to validate user sessions. |
| `DATABASE_URL` | Production | PostgreSQL connection string. Takes precedence over split DB vars. |
| `DB_SSL` | Production | Use `true` for hosted PostgreSQL providers that require TLS. |
| `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASSWORD`/`DB_NAME` | Local/Docker | Split PostgreSQL connection settings. |

Never commit `.env`. If a secret was committed or exposed, rotate it before deploying. This API does not need `SUPABASE_SERVICE_ROLE_KEY`.

## Local Docker stack

```bash
docker compose up --build
```

Services:

| Service | URL |
|---|---|
| Backend | `http://localhost:3000` |
| Health check | `http://localhost:3000/api/health` |
| PostgreSQL | `localhost:5432` |

The compose file also expects the frontend at `../Album-frontend`.

## Deploy to Vercel

This repository includes:

- `api/index.js`: Vercel serverless entrypoint.
- `vercel.json`: rewrites requests to the Express app.
- `npm run vercel-build`: syntax verification during deployment.

Deployment steps:

1. Import `NicolasHoyosDevss/Album-backend` in Vercel.
2. Set the environment variables from `.env.example`.
3. Use a hosted PostgreSQL database, for example Supabase Postgres.
4. Run `database/init.sql` once against that database before using authenticated album endpoints.
5. Add the deployed frontend URL to `CORS_ORIGINS`.

## API

See [`docs/API.md`](docs/API.md) for endpoints and payloads.

## Verification

```bash
npm test
```

The current verification checks JavaScript syntax for the server, serverless entrypoint, and scripts. Add integration tests before changing database behavior; otherwise you're building on vibes, not evidence.