import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

function read(path) {
    return readFileSync(join(root, path), 'utf8')
}

function assertIncludes(path, needle, description) {
    const source = read(path)

    if (!source.includes(needle)) {
        throw new Error(`${description} is missing in ${path}`)
    }
}

assertIncludes(
    'app/actions.ts',
    'ingredientIdsBelongToHousehold',
    'Meal create/update household ingredient validation'
)
assertIncludes(
    'app/actions-grocery.ts',
    'where: { id: mealId, householdId: household.id }',
    'Add-to-grocery-list meal ownership validation'
)
assertIncludes(
    'app/api/ingredients/route.ts',
    'getOptionalAuthenticatedContext',
    'Ingredient API 401 auth handling'
)
assertIncludes(
    'app/api/ingredients/route.ts',
    'Object.values(IngredientCategory)',
    'Ingredient API category enum validation'
)
assertIncludes(
    'app/actions.ts',
    'parseOptionalProtein',
    'Meal action protein enum validation'
)
assertIncludes(
    'app/actions-meal-log.ts',
    'parseOptionalProtein',
    'Meal log protein enum validation'
)
assertIncludes(
    'app/api/ingredients/route.ts',
    'Invalid JSON body',
    'Ingredient API malformed JSON handling'
)
assertIncludes(
    'app/actions-households.ts',
    'ensureOnlyWorkOSOrganizationMembership',
    'WorkOS one-organization membership cleanup'
)

console.log('Production safety audit passed.')
