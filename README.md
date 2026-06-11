# Meal Assistant

A full-stack household meal planning app built with Next.js, React, Prisma, PostgreSQL, and WorkOS AuthKit.

## What The App Does

- Uses WorkOS sign-in for authenticated access.
- Creates one local household per user unless they join someone else's household by invite.
- Shares meals, ingredients, leftovers, grocery lists, and meal logs within a household.
- Keeps meal preference scores per user so household members can get different dashboard suggestions.
- Lets household owners copy and refresh invite links, remove members, and choose whether meal templates can appear in Discover.
- Lets users browse opted-in Discover meals from other households and copy selected templates into their own household.

## Main Areas

- `Today`: deterministic meal suggestions from saved meals, preferences, cooked history, leftovers, recipe links, and ingredient counts.
- `Meals`: create, edit, delete, filter, cook, and copy meals into grocery lists.
- `Leftovers`: log cooked meals and track freshness.
- `Grocery`: create saved grocery lists from meals, edit items, check items off, and manage the ingredient catalog.
- `Discover`: copy meal templates from households that opted in to sharing.
- `Household`: manage invite links, members, leave/copy flows, and Discover sharing.

## Tech Stack

- Next.js `16` App Router
- React `19`
- TypeScript
- Prisma `7`
- PostgreSQL via `@prisma/adapter-pg`
- WorkOS AuthKit
- Tailwind CSS `4`

## Environment Variables

Create a `.env` file in the project root for local development:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/meal_assistant?schema=public"
WORKOS_API_KEY="sk_test_..."
WORKOS_CLIENT_ID="client_..."
WORKOS_COOKIE_PASSWORD="at-least-32-characters"
NEXT_PUBLIC_WORKOS_REDIRECT_URI="http://localhost:3000/callback"
```

For production, use production WorkOS credentials and set:

```bash
NEXT_PUBLIC_WORKOS_REDIRECT_URI="https://YOUR_DOMAIN/callback"
```

Also configure the same production callback URL in the WorkOS Dashboard.

## WorkOS Setup

Local development:

- Redirect URI: `http://localhost:3000/callback`
- Sign-in endpoint: `http://localhost:3000/login`
- Sign-out redirect: `http://localhost:3000`

Production:

- Redirect URI: `https://YOUR_DOMAIN/callback`
- Sign-in endpoint: `https://YOUR_DOMAIN/login`
- Sign-out redirect: `https://YOUR_DOMAIN`
- Use production WorkOS API key and client ID.
- Use a production-only `WORKOS_COOKIE_PASSWORD`; do not reuse a short or checked-in value.

## Local Development

Install dependencies:

```bash
npm install
```

Generate Prisma client and apply migrations:

```bash
npm run prisma -- generate
npm run prisma -- migrate deploy
```

Run the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Available Scripts

- `npm run dev`: start the development server.
- `npm run build`: generate Prisma client, deploy migrations, and build Next.js.
- `npm run start`: start the production server.
- `npm run lint`: run ESLint.
- `npm run prisma`: run the Prisma CLI.

## Documentation

- `PROJECT_STRUCTURE.md`: orientation guide for agents working in the repository.
- `USER_HOUSEHOLD_AUTH_PLAN.html`: migration plan and running implementation notes for users, households, WorkOS, default ingredients, invites, and Discover.
