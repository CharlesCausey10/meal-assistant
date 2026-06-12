import { prisma } from '@/lib/prisma'
import { measureAsync } from '@/lib/timing'
import { IngredientEditContent } from './components/ingredient-edit-content'
import type { IngredientCategory } from '@prisma/client'

const INGREDIENT_CATEGORIES: IngredientCategory[] = [
    'OTHER',
    'DAIRY',
    'DRINKS',
    'GRAINS_BREAD',
    'SWEETS',
    'SNACKS_CHIPS',
    'NUTS_SEEDS',
    'SPICES_HERBS',
    'BAKING',
    'CANNED_GOODS',
    'OILS_VINEGARS',
    'CONDIMENTS',
    'FROZEN',
    'MEAT',
    'SEAFOOD',
    'PRODUCE',
]

export async function IngredientEditTab({ householdId }: { householdId: number }) {
    const ingredients = await measureAsync(
        'tab.ingredients.queries',
        () => prisma.ingredient.findMany({
            where: { householdId },
            orderBy: [{ category: 'asc' }, { name: 'asc' }],
        }),
        { tab: 'ingredients' }
    )

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <IngredientEditContent
                ingredients={ingredients}
                ingredientCategories={INGREDIENT_CATEGORIES}
            />
        </div>
    )
}
