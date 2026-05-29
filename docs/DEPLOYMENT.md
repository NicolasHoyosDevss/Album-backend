# Deployment Guide

This backend is ready for Vercel as a Node.js serverless app and for container hosting with Docker.

## Vercel checklist

- [ ] Repository connected: `NicolasHoyosDevss/Album-backend`.
- [ ] Environment variables copied from `.env.example`.
- [ ] `DATABASE_URL` points to a reachable PostgreSQL database.
- [ ] `DB_SSL=true` when the provider requires TLS.
- [ ] `SUPABASE_URL` and `SUPABASE_ANON_KEY` match the frontend Supabase project.
- [ ] `CORS_ORIGINS` includes the production frontend origin: `https://album-front-two.vercel.app`.
- [ ] `database/init.sql` has been executed once in the target database.
- [ ] `GET /api/health` returns `{ "status": "ok" }` after deploy.

## Database setup

Run `database/init.sql` in the PostgreSQL database used by `DATABASE_URL`.

Warning: `database/init.sql` drops and recreates the app tables. Use it for initial setup or intentional resets only.

## Local verification

```bash
npm install
npm test
```

## Docker deployment

```bash
docker build -t album-backend .
docker run --env-file .env -p 3000:3000 album-backend
```