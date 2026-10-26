# Visitwise

Visitwise is a visit record for a physiotherapist. The doctor enters each patient once. At the end of a day they mark who was treated. A leave moves that treatment to the next calendar day, and the course chart reads as treatment days plus leave days.

The app is built to run on this computer first. The same API and PostgreSQL schema move to Amazon ECS and Amazon RDS when the paid AWS plan is in place. A phone uses that same site from the home screen.

## Docs

1. [Product rules](docs/product.md) — what is stored, how a day closes, how leave and extend work
2. [Architecture](docs/architecture.md) — records, the chart calculation, and the stack
3. [Screens](docs/ui.md) — every screen and what the doctor does there
4. [Hosting and install](docs/hosting.md) — local now, AWS after the paid plan

## Stack

- TypeScript, Node.js 22 or newer
- React, Vite, React Router, Tailwind CSS
- Zod, Hono, Prisma, PostgreSQL 16
- Vitest for the chart and earnings rules
- Docker for the local database
- AWS later: ECS on Fargate, an Application Load Balancer, RDS for PostgreSQL, S3, CloudFront, ECR, Secrets Manager, Route 53

## Run locally

1. Start Docker Desktop, and use Node.js 22 or newer.
2. From this folder:

```bash
docker compose up -d
npm install
copy apps\api\.env.example apps\api\.env
npm run db:migrate
npm run dev
```

3. Open http://localhost:5173 and create the doctor account.

The API listens on port 3001. PostgreSQL listens on port 5432. The password in `apps/api/.env` is for this local database only.

`npm test` runs the chart and earnings tests.
