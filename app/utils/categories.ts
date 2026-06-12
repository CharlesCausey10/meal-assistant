import { Category } from '@prisma/client'
import { formatLabel } from './format'

export const MEAL_CATEGORY_OPTIONS = [
    Category.BREAKFAST,
    Category.LUNCH,
    Category.DINNER,
    Category.SIDE_STARTER,
    Category.SNACK,
    Category.DESSERT,
] as const

export function getMealCategoryLabel(category: string) {
    return formatLabel(category)
}

export function normalizeMealCategories(values: FormDataEntryValue[]): Category[] {
    const validCategories = new Set<string>(MEAL_CATEGORY_OPTIONS)
    const categories = values
        .map((value) => String(value))
        .filter((value): value is Category => validCategories.has(value))

    return Array.from(new Set(categories))
}

export function getMealCategoriesForDisplay(meal: { category: Category | string; categories?: string[] }) {
    return meal.categories && meal.categories.length > 0
        ? meal.categories
        : [meal.category]
}

export function hasMealCategory(meal: { category: Category | string; categories?: string[] }, category: string) {
    return getMealCategoriesForDisplay(meal).includes(category)
}
