# Meal Planner Project Structure

This document is a quick orientation guide for agents working in this repository. It summarizes the app architecture, major files, and where to make common changes so future work can start from shared context instead of re-inspecting the whole project.

## High-Level Overview

Meal Planner is a full-stack Next.js App Router application for managing meals, ingredients, cooked-meal logs, and grocery lists. It uses React client components for interactive UI, Next server components/server actions for data loading and mutations, and Prisma 7 with PostgreSQL for persistence.

The app is organized around six user-facing areas:

- Today: the first screen dashboard with deterministic meal suggestions from saved meals, cooked logs, active leftovers, recipe URLs, preference scores, and ingredient counts.
- Meals: create, edit, delete, filter, and browse meal templates with ingredients; cook links a `MealLog` via `mealId`.
- Leftovers: record cooked meals and display freshness/expiration status; removing an entry sets `MealLog.isActive` to false.
- Grocery lists: create lists from selected meals, aggregate meal ingredients, manually add/edit/check off items, copy lists, and hide checked/amounts.
- Ingredients: maintain the reusable ingredient catalog used by meals and grocery lists.
- Discover: browse opted-in meal templates from other households, hide suggestions locally for 30 days, and copy selected meals into the current household.

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
- `.env.example` documents the required database and WorkOS environment variable names without real secrets.
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

### Authentication Context

`lib/auth.ts` contains WorkOS/local auth helpers:

- `getAuthenticatedContext()` is used by server components and route handlers that should require sign-in.
- `getAuthenticatedActionContext()` is used by server actions; it calls `withAuth()` without `ensureSignedIn` and redirects to sign-in when no user exists.
- `upsertUserFromWorkOS()` syncs WorkOS users into the local `User` table. If a production WorkOS environment issues a new `workosUserId` for an email that already exists from staging/local testing, the helper relinks the existing local user by email instead of creating a duplicate.
- The bootstrap path links the first signed-in WorkOS user as `OWNER` of `Personal Household` if no WorkOS organization context exists yet.
- If WorkOS supplies an organization ID that has no local household, the helper creates a local household shell with that `workosOrganizationId`.

### Prisma Schema

`prisma/schema.prisma` is the source of truth for models and enums.

Enums:

- `Protein`: `CHICKEN_BREAST`, `CHICKEN_THIGHS`, `ROTISSERIE_CHICKEN`, `GROUND_BEEF`, `PORK_BUTT`, `FISH`, `EGGS`.
- `Category`: `BREAKFAST`, `LUNCH`, `DINNER`, `SIDE_STARTER`, `SNACK`, `DESSERT`.
- `IngredientCategory`: produce, meat, seafood, dairy, drinks, grains/bread, nuts/seeds, baking, oils/vinegars, condiments, canned goods, frozen, snacks/chips, spices/herbs, sweets, other.
- `HouseholdRole`: `OWNER`, `MEMBER`.

Models:

- `User`: local user profile linked to a WorkOS user ID, with household memberships and per-user meal preferences.
- `Household`: local household/workspace linked to an optional WorkOS organization ID; owns meals, ingredients, logs, grocery lists, one active app-level invite token, and nullable Discover sharing consent.
- `HouseholdMember`: join table between users and households with an owner/member role.
- `Meal`: meal template with optional household ownership, a legacy/primary `category`, multi-category `MealCategory` tags, optional protein, notes, recipe URL, ingredients, grocery-list uses, logs, and per-user preferences. Normal user-facing meals should be household-owned; new households start with no default meals and add meals manually or copy them from Discover.
- `MealCategory`: meal-window tag join table that lets one meal appear in multiple categories such as both lunch and dinner. Existing `Meal.category` is still retained as a primary/backward-compatible category until duplicate meal cleanup and eventual simplification.
- `MealPreference`: per-user 1-10 preference score for a meal. Existing scores were migrated here from the removed `Meal.preference` column.
- `Ingredient`: reusable ingredient catalog entry with optional household ownership (`householdId = null` means global default/template), name, and category.
- `MealIngredient`: join table between meals and ingredients, with `quantity` and `unit`; unique per `(mealId, ingredientId)`.
- `MealLog`: household-linked cooked-meal log entry with name, optional protein, cooked date, optional `mealId` (recipe link), and `isActive` (soft delete).
- `GroceryList`: household-linked saved grocery list with notes, items, source meals, created/updated timestamps.
- `GroceryListMeal`: join table tracking which meals contributed to a grocery list.
- `GroceryListItem`: grocery item snapshot with optional ingredient link, quantity, unit, note, checked state, category, and sort order.

Migrations live in `prisma/migrations/`. Notable migrations add the base schema, ingredients, category enum expansions, recipe URLs, grocery lists, drinks, snacks/chips, and the first phase of user/household schema work.

`USER_HOUSEHOLD_AUTH_PLAN.html` is a standalone implementation plan for the WorkOS, user, household, default ingredient, and meal preference migration. Keep it updated when the auth/data-model plan changes.

## Next App Structure

### Routing Entry Points

- `app/layout.tsx`: root HTML/body wrapper and global metadata.
- `app/page.tsx`: protected main server component for `/`. It syncs the current WorkOS user into local user/household context, reads `searchParams`, routes the special `?tab=ingredients` view, and otherwise renders the tabbed page layout with Today, Meals, Leftovers, Grocery, and Discover tabs.
- `proxy.ts`: Next.js 16 AuthKit proxy for WorkOS session handling.
- `app/login/route.ts`: starts the WorkOS AuthKit sign-in flow.
  - Accepts an optional `returnPathname`, but only uses app-local paths that begin with a single `/`.
- `app/callback/route.ts`: WorkOS AuthKit callback route; syncs the authenticated WorkOS user into local tables.
- `app/logout/route.ts`: signs the current user out through WorkOS.
- `app/households/page.tsx`: household management screen for linking the current household to WorkOS, copying/refreshing the invite link, removing members, and letting non-owner members leave into a new personal household through a confirmation modal with copy options.
- `app/invite/[token]/page.tsx`: app-level household invite acceptance page. Signed-out users are sent through `/login` and returned to the invite; signed-in users can join the household.
- `app/dashboard-tab.tsx`: server-rendered first-screen dashboard. It computes meal stats from `MealLog`, picks the time-of-day meal window, and renders Top Breakfast/Brunch/Lunch/Dinner/Midnight Snack Ideas, Use Soon, Forgotten Favorites, and Snack Ideas.
- `app/api/ingredients/route.ts`: API route used by client-side ingredient autocomplete and creation.

The app uses query parameters rather than separate URL routes for most navigation:

- `tab=today`, `tab=meals`, `tab=leftovers`, `tab=grocery`, `tab=ingredients` (legacy `tab=recipes` and `tab=logs` redirect in `page-layout.tsx`).
- Meal filters: `search`, `protein`, `category`.
- Grocery selection: `listId`.

### Tab Server Components

These files fetch server data and pass serialized data into client components:

- `app/meal-planner-tab.tsx`
  - Fetches current-household meals with nested meal ingredients and ingredient records.
  - Fetches current-household grocery-list names for the "Add to List" flow.
  - Fetches current-household cooked meal logs linked to meals to compute `lastCookedAt`, `cookedCount`, and `daysSinceCooked`.
  - Includes the current user's `MealPreference` row and the meal's `MealCategory` tags, then sorts serialized meals by per-user preference and `createdAt desc`.
  - Uses `serializeMeals()` to convert Prisma Decimal quantities and attach cooked stats before crossing into client components.

- `app/dashboard-tab.tsx`
  - Fetches current-household meals with ingredients, meal-linked cooked logs, and active leftovers.
  - Computes `lastCookedAt`, `cookedCount`, and `daysSinceCooked` from `MealLog`.
  - Uses the current time to title the top meal rail as Breakfast (4-10:30), Brunch (10:30-12), Lunch (12-3), Dinner (3-11), or Midnight Snack (11-4).
  - Brunch interleaves ranked breakfast and lunch meals; meal-window filtering uses `MealCategory` tags with `Meal.category` as a fallback.
  - Renders horizontal browse rails for Top Ideas, Use Soon, Forgotten Favorites, and Snack Ideas.
  - Excludes dessert meals from dashboard suggestion rails; desserts remain available in the Meals tab.
  - Avoids pantry/readiness claims; chips are limited to deterministic signals such as preference score, last cooked age, cooked count, recipe URL presence, ingredient count, and leftover expiration.

- `app/meal-log-tab.tsx`
  - Fetches `MealLog` records ordered by `cookedAt desc`.
  - Renders `MealLogContent`.

- `app/grocery-tab.tsx`
  - Fetches current-household grocery lists with source meals and items.
  - Fetches current-household meals that have ingredients for list generation.
  - Selects the current list from `listId` or falls back to the first list.
  - Serializes grocery item Decimal quantities.
  - Defines ingredient category order and grouped display order.

- `app/ingredient-edit-tab.tsx`
  - Fetches current-household ingredients sorted by category/name.
  - Supplies ingredient category options to the editor.

- `app/discover-tab.tsx`
  - Fetches meals from other households where `discoverableMealsOptIn = true`, filters duplicates, then passes up to 100 suggestions to the client.
  - Excludes meals with names that already exist in the current household.
  - Serializes meal ingredient Decimal quantities before passing suggestions to the client.

### Server Actions

Server actions mutate the database and usually call `revalidatePath('/')` afterward.

- `app/actions.ts`
  - `createMeal(formData)`
  - `updateMeal(formData)`
  - `deleteMeal(formData)`
  - Parses JSON-encoded ingredients from the meal form and writes nested `MealIngredient` rows.
  - Parses selected meal-window categories, stores the first as `Meal.category`, and writes all selected windows to `MealCategory`.

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

- `app/actions-households.ts`
  - `linkCurrentHouseholdToWorkOS(formData)`: owner-only action that creates a WorkOS Organization for the current local household, creates a WorkOS organization membership for the current user, stores `workosOrganizationId`, refreshes the session to the organization, and redirects home.
  - `leaveAndCopyHousehold(formData)`: member-only action that creates a new WorkOS Organization and personal household for the current user, optionally copies the current household's meals, ingredients, that user's meal preferences, and meal logs, removes the user from the old household, refreshes session organization context, and redirects home. Meal logs can only be copied when meals are copied. The copy path bulk-inserts ingredients, meal ingredients, preferences, and logs to avoid interactive transaction timeouts, and it cleans up the newly created household/WorkOS Organization if copying fails before the membership move. Owners cannot use this because they already control their household.
  - `refreshHouseholdInviteLink()`: owner-only action that rotates the current household invite token.
  - `updateDiscoverableMealsOptIn(formData)`: owner-only action that sets the household Discover sharing tri-state from undecided to allowed/private.
  - `acceptHouseholdInvite(formData)`: accepts an app-level household invite, moves the user out of their current household, deletes their old household only when it becomes empty, creates the WorkOS organization membership, creates the local household membership, refreshes session organization context, and redirects home.
  - `removeHouseholdMember(formData)`: owner-only action that moves another member into a new personal household with copied meals/ingredients, then removes that member from WorkOS and the current local household.

- `app/actions-discover.ts`
  - `copyDiscoveredMeal(mealId)`: validates that the source meal belongs to an opted-in household, skips duplicate meal names already in the current household, and copies the selected meal plus its used ingredients into the current household.

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

- `app/discover-content.tsx`
  - Client shell for the Discover tab.
  - Uses browser `localStorage` under the current local user ID to hide copied or dismissed meal IDs for 30 days.
  - Shows specific empty states for no shared meals, all shared meals already existing by name, and all suggestions hidden in this browser.
  - Does not write passive impressions, hides, or skips to the database.

## Component Directory

`app/components/` contains reusable UI and larger feature components:

- `page-layout.tsx`: tabbed full-page layout used by `/`.
- `leave-household-control.tsx`: member-only leave-household modal with pre-checked copy options for meals/ingredients/preferences and meal logs.
- `responsive-modal.tsx`: responsive modal/drawer-like overlay used for mobile and focused forms.
- `meal-form.tsx`: create meal form.
- `category-checkbox-group.tsx`: reusable multi-select meal-window tag control used by create/edit meal forms.
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
  - Flattens the current user's included `MealPreference` relation into a client-facing `preference` value so existing meal cards/forms can keep using that field shape.

- `app/utils/expiration.ts`
  - Protein-specific cooked-meal expiration logic.
  - Exports expiration-day map and helpers for expiration date, days left, and status.

- `app/utils/format.ts`
  - Converts enum-like strings into user-facing labels, with special cases such as `GRAINS_BREAD`.

- `app/utils/preference.ts`
  - Filters preference input to numeric values from 0 through 10.

- `lib/household-copy.ts`
  - Shared copy helpers for copying global ingredients, copying meals plus ingredients/preferences, and copying meal logs between households.
  - When specific meal IDs are provided, only ingredients used by those meals are copied; full household copy flows still copy the full source ingredient catalog.

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

- Change the Today dashboard:
  - Start in `app/dashboard-tab.tsx`.
  - Keep suggestions deterministic from existing data; do not add pantry-maintenance assumptions or "ready now" claims without a non-chore data source.
  - Reuse `serializeMeals()` when meal ingredients or cooked stats cross into client-facing component boundaries.

## Agent Notes

- This repo uses server components for initial data loading and client components for interactivity.
- Prisma Decimal values must be converted before being passed to client components.
- Most mutations revalidate `/`; if introducing more routes or finer-grained caching, revisit revalidation paths.
- The app currently has duplicated ingredient category order arrays in `grocery-tab.tsx` and `ingredient-edit-tab.tsx`; future cleanup could centralize this.
- `app/components/grocery-list-content.tsx` is the largest and most stateful file. Changes there should be made carefully and verified on both desktop and mobile layouts.
- `README.md` describes the current app, local environment variables, and WorkOS production setup checklist. This file remains more complete for code navigation and common change locations.
