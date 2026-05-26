# Prodigy Finance — Backend Setup Guide

## Prerequisites
- Node.js 18+ and npm
- Git

## 1 · Clone and install dependencies

```bash
npm install
```

---

## 2 · Create a free Supabase PostgreSQL database

1. Go to **https://supabase.com** and sign up (free, no credit card needed).
2. Click **"New project"** — enter a project name, set a strong **Database Password** (save it!), and pick the nearest region.
3. Wait ~2 minutes for the project to be provisioned.
4. Go to **Project Settings → Database → Connection string**.
5. Select the **"URI"** tab — you will see a connection string with `[YOUR-PASSWORD]` placeholder.
6. Get two URLs:
   - Change port to **6543** → copy as `DATABASE_URL` (pgbouncer / pooled — used at runtime)
   - Change port to **5432** → copy as `DIRECT_URL` (direct — used by Prisma migrations)

They look like:
```
postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijkl.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1
postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijkl.supabase.co:5432/postgres
```

---

## 3 · Configure environment variables

```bash
copy .env.example .env
```

Then open `.env` and fill in every value. At minimum you need:

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Supabase → Settings → Database → URI (port **6543**) |
| `DIRECT_URL` | Supabase → Settings → Database → URI (port **5432**) |
| `JWT_SECRET` | Run: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_REFRESH_SECRET` | Same command, run again for a different secret |
| `CLOUDINARY_CLOUD_NAME` | https://cloudinary.com → Dashboard |
| `CLOUDINARY_API_KEY` | https://cloudinary.com → Dashboard |
| `CLOUDINARY_API_SECRET` | https://cloudinary.com → Dashboard |
| `SMTP_USER` | Your Gmail address |
| `SMTP_PASS` | Gmail App Password from https://myaccount.google.com/apppasswords |
| `PAYSTACK_SECRET_KEY` | https://dashboard.paystack.com → Settings → API Keys |

---

## 4 · Generate the Prisma client

```bash
npm run db:generate
```

---

## 5 · Run database migrations

This pushes the full schema to your Neon database:

```bash
npm run db:migrate
```

> **Note:** During the first run, Prisma will ask you to name the migration — type any short name (e.g. `init`).

For production deploys (no interactive prompt):

```bash
npm run db:migrate:prod
```

---

## 6 · Start the development server

```bash
npm run start:dev
```

The API will be running at:
- **API base:** http://localhost:3000/api/v1
- **Swagger docs:** http://localhost:3000/api/docs

---

## 7 · Verify connection

Open your browser to http://localhost:3000/api/docs — you should see the Swagger UI.

To test the database connection, call:
```
GET http://localhost:3000/api/v1/products
```
It should return `[]` (empty array, no error).

---

## Troubleshooting

### `Error: Can't reach database server at localhost:5432`
You still have the old local DATABASE_URL. Make sure `.env` has the Supabase URL (not localhost).

### `Error: SSL connection required`
Add `?sslmode=require` to the end of your connection string.

### `PrismaClientInitializationError`
Run `npm run db:generate` again after editing `.env`.

### JWT errors on protected routes
Make sure `JWT_SECRET` and `JWT_REFRESH_SECRET` are both set and are different values.

---

## Quick reference — all npm scripts

| Script | What it does |
|---|---|
| `npm run start:dev` | Start with hot-reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run compiled `dist/main.js` |
| `npm run db:generate` | Re-generate Prisma client after schema changes |
| `npm run db:migrate` | Run pending migrations (dev) |
| `npm run db:migrate:prod` | Run pending migrations (production, no prompts) |
| `npm run db:studio` | Open Prisma Studio (visual DB browser) |
