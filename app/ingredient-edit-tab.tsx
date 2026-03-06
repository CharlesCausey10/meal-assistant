import { prisma } from '@/lib/prisma'
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

export async function IngredientEditTab() {
    const ingredients = await prisma.ingredient.findMany({
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <IngredientEditContent
                ingredients={ingredients}
                ingredientCategories={INGREDIENT_CATEGORIES}
            />
        </div>
    )
}
