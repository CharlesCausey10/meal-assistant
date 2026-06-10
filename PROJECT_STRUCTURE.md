# Meal Planner Project Structure

This document is a quick orientation guide for agents working in this repository. It summarizes the app architecture, major files, and where to make common changes so future work can start from shared context instead of re-inspecting the whole project.

## High-Level Overview

Meal Planner is a full-stack Next.js App Router application for managing meals, ingredients, cooked-meal logs, and grocery lists. It uses React client components for interactive UI, Next server components/server actions for data loading and mutations, and Prisma 7 with PostgreSQL for persistence.

The app is organized around four user-facing areas:

- Recipes: create, edit, delete, filter, and browse meal templates with ingredients; cook links a `MealLog` via `mealId`.
- Leftovers: record cooked meals and display freshness/expiration status; removing an entry sets `MealLog.isActive` to false.
- Grocery lists: create lists from selected meals, aggregate meal ingredients, manually add/edit/check off items, copy lists, and hide checked/amounts.
- Ingredients: maintain the reusable ingredient catalog used by meals and grocery lists.

## Top-Level Layout

```text
.
├── app/                    Next.js App Router pages, tabs, server actions, UI components, utilities
├── lib/                    Shared server-side infrastructure
├── prisma/                 Prisma schema and migrations
├── public/                 Static assets from the default Next template
├── generated/              Generated Prisma client output; do not hand-edit
├── scripts/                Currently empty
├── .next/                  Local Next build/dev output; generated
├── node_modules/           Installed npm dependencies; generated
├── dev.db                  Legacy/local SQLite database artifact; app config currently targets PostgreSQL
├── grocery-list-plan.txt   Planning notes for grocery-list work
├── README.md               User-facing setup and feature overview
└── package.json            Scripts and dependency declarations
```

Important generated or environment-specific files:

- `.env` contains `DATABASE_URL` and should not be documented with secrets or committed.
- `.next/`, `node_modules/`, and `generated/` are build/dependency/generated output.
- `generated/prisma/` appears to be generated Prisma output from an earlier/client-generation configuration; the application imports Prisma from `@prisma/client`, not from `generated/prisma`.

## Runtime And Tooling

- Framework: Next.js `16.1.6` with App Router.
- UI: React `19.2.3`, TypeScript, Tailwind CSS `4`.
- ORM: Prisma `7.4.2`.
- Database: PostgreSQL via `@prisma/adapter-pg`.
- Path alias: `@/*` maps to the repository root via `tsconfig.json`.
- Package type: ESM (`"type": "module"`).

Useful scripts:

```bash
npm run dev      # start Next dev server
npm run build    # prisma generate, prisma migrate deploy, next build
npm run start    # start production server
npm run lint     # run ESLint
npm run prisma   # run Prisma CLI
```

## Data Layer

### Prisma Connection

`lib/prisma.ts` creates the shared Prisma client:

- Imports `PrismaClient` from `@prisma/client`.
- Uses `PrismaPg` from `@prisma/adapter-pg`.
- Reads `process.env.DATABASE_URL`.

### Prisma Schema

`prisma/schema.prisma` is the source of truth for models and enums.

Enums:

- `Protein`: `CHICKEN_BREAST`, `CHICKEN_THIGHS`, `ROTISSERIE_CHICKEN`, `GROUND_BEEF`, `PORK_BUTT`, `FISH`, `EGGS`.
- `Category`: `BREAKFAST`, `LUNCH`, `DINNER`, `SIDE_STARTER`, `SNACK`, `DESSERT`.
- `IngredientCategory`: produce, meat, seafood, dairy, drinks, grains/bread, nuts/seeds, baking, oils/vinegars, condiments, canned goods, frozen, snacks/chips, spices/herbs, sweets, other.

Models:

- `Meal`: meal template with optional protein, required category, optional preference, notes, recipe URL, meal ingredients, and grocery-list uses.
- `Ingredient`: reusable ingredient catalog entry with unique `name` and category.
- `MealIngredient`: join table between meals and ingredients, with `quantity` and `unit`; unique per `(mealId, ingredientId)`.
- `MealLog`: cooked-meal log entry with name, optional protein, cooked date, optional `mealId` (recipe link), and `isActive` (soft delete).
- `GroceryList`: saved grocery list with notes, items, source meals, created/updated timestamps.
- `GroceryListMeal`: join table tracking which meals contributed to a grocery list.
- `GroceryListItem`: grocery item snapshot with optional ingredient link, quantity, unit, note, checked state, category, and sort order.

Migrations live in `prisma/migrations/`. Notable migrations add the base schema, ingredients, category enum expansions, recipe URLs, grocery lists, drinks, and snacks/chips.

## Next App Structure

### Routing Entry Points

- `app/layout.tsx`: root HTML/body wrapper and global metadata.
- `app/page.tsx`: main server component for `/`. It reads `searchParams`, routes the special `?tab=ingredients` view, and otherwise renders the tabbed page layout with Recipes, Leftovers, and Grocery tabs.
- `app/api/ingredients/route.ts`: API route used by client-side ingredient autocomplete and creation.

The app uses query parameters rather than separate URL routes for most navigation:

- `tab=recipes`, `tab=leftovers`, `tab=grocery`, `tab=ingredients` (legacy `tab=meals` and `tab=logs` redirect in `page-layout.tsx`).
- Meal filters: `search`, `protein`, `category`.
- Grocery selection: `listId`.

### Tab Server Components

These files fetch server data and pass serialized data into client components:

- `app/meal-planner-tab.tsx`
  - Fetches meals with nested meal ingredients and ingredient records.
  - Fetches grocery-list names for the "Add to List" flow.
  - Sorts meals by `preference desc`, then `createdAt desc`.
  - Uses `serializeMeals()` to convert Prisma Decimal quantities before crossing into client components.

- `app/meal-log-tab.tsx`
  - Fetches `MealLog` records ordered by `cookedAt desc`.
  - Renders `MealLogContent`.

- `app/grocery-tab.tsx`
  - Fetches all grocery lists with source meals and items.
  - Fetches meals that have ingredients for list generation.
  - Selects the current list from `listId` or falls back to the first list.
  - Serializes grocery item Decimal quantities.
  - Defines ingredient category order and grouped display order.

- `app/ingredient-edit-tab.tsx`
  - Fetches all ingredients sorted by category/name.
  - Supplies ingredient category options to the editor.

### Server Actions

Server actions mutate the database and usually call `revalidatePath('/')` afterward.

- `app/actions.ts`
  - `createMeal(formData)`
  - `updateMeal(formData)`
  - `deleteMeal(formData)`
  - Parses JSON-encoded ingredients from the meal form and writes nested `MealIngredient` rows.

- `app/actions-meal-log.ts`
  - `logMeal(formData)`
  - `deleteMealLog(formData)`

- `app/actions-grocery.ts`
  - `createGroceryList(formData)`: creates an empty list or aggregates selected meal ingredients into list items.
  - `generateGroceryListFromMeals(formData)`: wrapper around list creation for selected meals.
  - `toggleGroceryItemChecked(formData)`.
  - `updateGroceryItem(formData)`.
  - `addManualGroceryItem(formData)`.
  - `deleteGroceryItem(formData)`.
  - `deleteGroceryList(formData)`.
  - `addMealToGroceryList(formData)`: upserts the meal/list relationship and merges matching ingredient+unit grocery items.
  - Helpers parse numeric/category form values and touch `updatedAt` after item changes.

- `app/actions-ingredients.ts`
  - `createIngredient(formData)`.
  - `updateIngredient(formData)`.
  - `deleteIngredient(formData)`.
  - Handles unique-name Prisma errors as user-readable errors.

### Client Content Components

- `app/meal-planner-content.tsx`
  - Client shell for the Meals tab.
  - Manages search, protein filters, category filters, and mobile add-meal modal.
  - Updates URL query parameters using `window.history`.
  - Filters already-fetched meals client-side.

- `app/meal-list.tsx`
  - Renders meal cards.
  - Supports inline meal editing, ingredient expansion, delete, cook/log modal, and add-to-grocery-list modal.
  - Uses `MealForm`, `IngredientInput`, `PreferenceInput`, `MealLogForm`, `ResponsiveModal`, `CookingAnimation`, and `Toast`.

- `app/meal-log-content.tsx`
  - Client shell for the Log tab with desktop form/sidebar and mobile modal.

- `app/meal-log-list.tsx`
  - Displays cooked-meal logs, calculates freshness using expiration utilities, and handles log deletion.

- `app/grocery-tab.tsx` plus grocery components under `app/components/`
  - Server fetch is in `grocery-tab.tsx`.
  - Client orchestration is split across wrapper/sidebar/content/item components.

- `app/ingredient-edit-tab.tsx` plus `app/components/ingredient-edit-content.tsx`
  - Server fetch is in `ingredient-edit-tab.tsx`.
  - Client editing UI is in `ingredient-edit-content.tsx`.

## Component Directory

`app/components/` contains reusable UI and larger feature components:

- `page-layout.tsx`: tabbed full-page layout used by `/`.
- `responsive-modal.tsx`: responsive modal/drawer-like overlay used for mobile and focused forms.
- `meal-form.tsx`: create meal form.
- `meal-log-form.tsx`: create cooked-meal log form.
- `meal-selector.tsx`: meal multi-selector used when creating grocery lists.
- `ingredient-input.tsx`: ingredient autocomplete/entry component used by meal forms.
- `ingredient-edit-content.tsx`: full ingredient CRUD UI.
- `preference-input.tsx`: constrained preference input UI.
- `grocery-list-wrapper.tsx`: client wrapper that coordinates sidebar and selected list content.
- `grocery-list-sidebar.tsx`: grocery list creation, saved-list navigation, deletion, and ingredient-editor link.
- `grocery-list-content.tsx`: main grocery-list UI; groups items by category, manages hide-checked/hide-amounts preferences in localStorage, autocomplete for manual items, copy-to-clipboard, grouped item toggles, and mobile actions.
- `grocery-item.tsx`: single grocery item display/edit/delete/toggle behavior.
- `toast.tsx`: transient feedback message.
- `cooking-animation.tsx`: small animation used on cook actions.

## Utility Files

- `app/utils/convert-prisma.ts`
  - Converts Prisma Decimal `quantity` fields to plain numbers for client-component serialization.

- `app/utils/expiration.ts`
  - Protein-specific cooked-meal expiration logic.
  - Exports expiration-day map and helpers for expiration date, days left, and status.

- `app/utils/format.ts`
  - Converts enum-like strings into user-facing labels, with special cases such as `GRAINS_BREAD`.

- `app/utils/preference.ts`
  - Filters preference input to numeric values from 0 through 10.

## Styling And UI Notes

- Global styles live in `app/globals.css`.
- Tailwind CSS 4 is configured through `postcss.config.mjs`.
- The visual design uses warm, naturally occurring color tokens defined in `app/globals.css` and exposed to Tailwind through `@theme inline`. Prefer semantic classes such as `bg-app-surface`, `text-app-text`, `border-app-border`, `bg-primary`, `text-primary-text`, `text-danger`, and `bg-warning-soft` over hard-coded hex values or raw color-family utilities.
- Several components use emoji labels and inline SVG icons directly rather than an icon library.
- The layout is responsive: desktop uses sidebars/forms, while mobile often opens `ResponsiveModal` controls.

## API Route

`app/api/ingredients/route.ts` supports:

- `GET /api/ingredients`: returns all ingredients ordered by name.
- `POST /api/ingredients`: accepts JSON `{ name, category }`; upserts by name and returns the ingredient.

This route is used by ingredient autocomplete/manual item flows that run in client components.

## Common Change Locations

- Add or change meal fields:
  - Update `prisma/schema.prisma`.
  - Add a migration.
  - Update `app/actions.ts`.
  - Update `app/components/meal-form.tsx`.
  - Update edit/display logic in `app/meal-list.tsx`.
  - Update serialization in `app/utils/convert-prisma.ts` if Prisma Decimal/date/object fields cross into client components.

- Add or change ingredient categories:
  - Update `IngredientCategory` in `prisma/schema.prisma`.
  - Add a migration.
  - Update category arrays in `app/grocery-tab.tsx` and `app/ingredient-edit-tab.tsx`.
  - Update labels in `app/utils/format.ts` if needed.

- Add or change protein expiration rules:
  - Update `Protein` in `prisma/schema.prisma` if adding a new protein.
  - Update UI select options in meal and log forms.
  - Update `PROTEIN_EXPIRATION_DAYS` in `app/utils/expiration.ts`.
  - Update any formatting/emoji display in `app/meal-list.tsx` and related forms.

- Change grocery list generation or aggregation:
  - Start in `app/actions-grocery.ts`.
  - Server fetch/selection logic is in `app/grocery-tab.tsx`.
  - Display grouping and copy behavior are in `app/components/grocery-list-content.tsx`.
  - Per-item edit/toggle/delete behavior is in `app/components/grocery-item.tsx`.

- Change meal filtering:
  - UI state and client-side filtering are in `app/meal-planner-content.tsx`.
  - Filter controls are in `app/filters.tsx`.

- Change main navigation/tabs:
  - Update `app/page.tsx`.
  - Update `app/components/page-layout.tsx` if tab rendering behavior changes.

## Agent Notes

- This repo uses server components for initial data loading and client components for interactivity.
- Prisma Decimal values must be converted before being passed to client components.
- Most mutations revalidate `/`; if introducing more routes or finer-grained caching, revisit revalidation paths.
- The app currently has duplicated ingredient category order arrays in `grocery-tab.tsx` and `ingredient-edit-tab.tsx`; future cleanup could centralize this.
- `app/components/grocery-list-content.tsx` is the largest and most stateful file. Changes there should be made carefully and verified on both desktop and mobile layouts.
- `README.md` describes the original meal/log scope and some setup steps, but this file is more complete for current code structure, especially grocery-list and ingredient-edit areas.
