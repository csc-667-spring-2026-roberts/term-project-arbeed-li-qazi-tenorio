# Team Name — Game Name

CSC 667 Term Project — Spring 2026

## Team Members

| Name            | GitHub       | Email             |
| --------------- | ------------ | ----------------- |
| Saeed Qazi      | @kameqazi1   | sqazi@sfsu.edu    |
| Jack Li         | @Nakapq      | jli105@sfsu.edu   |
| Jason Arbeed    | @Arbeedjason | jarbeed@sfsu.edu  |
| Justine Tenorio | @tatinCode   | jtenorio@sfsu.edu |

## Setup

```bash
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run db:migrate
npm run dev
```

## Scripts

- `npm run dev` — Start development server with hot reload
- `npm run build` — Compile TypeScript
- `npm start` — Run compiled server
- `npm run db:migrate` — Create the local app tables in PostgreSQL
- `npm run db:reset` — Drop the local app tables so you can start fresh
- `npm run lint` — Check for lint errors
- `npm run lint:fix` — Auto-fix lint errors
- `npm run format` — Format code with Prettier

## Database

This project currently uses a simple SQL-based setup instead of a full migration framework.

To initialize your local database:

```bash
npm run db:migrate
```

To wipe the local tables and start over:

```bash
npm run db:reset
npm run db:migrate
```

`db:reset` drops `users`, `games`, `players`, `hands`, `actions`, `test_messages`, and `user_sessions`. That is useful for local testing, but it should not be run against production.
