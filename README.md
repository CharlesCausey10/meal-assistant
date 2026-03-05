# Meal Planner

A full-stack meal planning app built with Next.js, React, Prisma, and PostgreSQL.

The app helps you:

- Save meals with category, protein, preference score, recipe URL, and ingredients.
- Browse and filter meals by search text, protein, and category.
- Log cooked meals and track freshness based on protein-specific expiration rules.

## What The App Does

The UI has two tabs:

- `Meals`: build and manage your meal library.
- `Log`: track cooked meals and see what is near expiration.

Core workflows:

- Create, edit, and delete meals.
- Add ingredient lines to each meal with quantity and unit.
- Create new ingredients on the fly from the meal form.
- Log a meal as cooked (with date and optional protein).
- Review cooked meals sorted by urgency (closest to expiring first).

## Expiration Logic

Cooked meal freshness is calculated from `cookedAt` plus a protein-specific number of days:

- `CHICKEN_BREAST`: 4 days
- `CHICKEN_THIGHS`: 4 days
- `ROTISSERIE_CHICKEN`: 4 days
- `GROUND_BEEF`: 5 days
- `PORK_BUTT`: 5 days
- `FISH`: 3 days
- `EGGS`: 7 days
- No protein selected: 7 days default

Status labels:

- `fresh`: more than 1 day left
- `expiring-soon`: 1 day or less left
- `expired`: 0 or fewer days left

## Tech Stack

- Next.js `16` (App Router)
- React `19`
- TypeScript
- Prisma ORM `7`
- PostgreSQL via `@prisma/adapter-pg`
- Tailwind CSS `4`

## Data Model (Prisma)

Main models:

- `Meal`: saved meal template
- `Ingredient`: reusable ingredient catalog
- `MealIngredient`: join table with `quantity` and `unit`
- `MealLog`: cooked meal log entries

Enums used in the app:

- `Protein`
- `Category`
- `IngredientCategory`

Schema lives at `prisma/schema.prisma`.

## API Routes

- `GET /api/ingredients`: list ingredients (sorted by name)
- `POST /api/ingredients`: create ingredient (`name`, `category`) or return existing one by name

## Local Development

### 1. Prerequisites

- Node.js 20+
- PostgreSQL instance

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Create a `.env` file in the project root:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/meal_planner?schema=public"
```

### 4. Generate Prisma client and apply migrations

```bash
npx prisma generate
npx prisma migrate deploy
```

For iterative local schema changes, use:

```bash
npx prisma migrate dev
```

### 5. Run the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## Available Scripts

- `npm run dev`: start development server
- `npm run build`: run `prisma generate`, run migrations (`prisma migrate deploy`), then build Next.js
- `npm run start`: start production server
- `npm run lint`: lint project with ESLint
- `npm run prisma`: run Prisma CLI

## Notable Behavior

- Meals are ordered by `preference desc`, then `createdAt desc`.
- Meal logs are fetched by `cookedAt desc`, then reordered in the UI by days left so urgent items appear first.
- Protein filtering includes meals with no protein set.
- Search is debounced on the client before refreshing results.
