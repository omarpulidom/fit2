import { CATALOG } from './data'
import type { ExternalFood, Food, FoodRegistration, Macro } from './types'

type FoodRecord = ExternalFood | FoodRegistration

export type GroupedFood = {
  key: string
  food: FoodRecord
  items: FoodRecord[]
  catalogFood?: Food
  count: number
  eatenPortion: number
  macro: Macro
}

const emptyMacro = (): Macro => ({
  kcal: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
})

const scaledMacro = (food: FoodRecord): Macro => {
  const scale = food.eatenPortion / food.referencePortion
  return {
    kcal: food.macro.kcal * scale,
    protein: food.macro.protein * scale,
    carbs: food.macro.carbs * scale,
    fat: food.macro.fat * scale,
  }
}

const keyFor = (food: FoodRecord) =>
  food.source === 'smae' && food.catalogFoodId
    ? `smae:${food.catalogFoodId}`
    : `external:${food.name}:${food.mode}:${food.referencePortion}:${food.macro.kcal}:${food.macro.protein}:${food.macro.carbs}:${food.macro.fat}`

export const groupFoods = (foods: FoodRecord[]): GroupedFood[] => {
  const catalogById = new Map(
    CATALOG.map((food) => [
      food.id,
      food,
    ]),
  )

  return foods.reduce<GroupedFood[]>((groups, food) => {
    const key = keyFor(food)
    const existing = groups.find((group) => group.key === key)
    const macro = scaledMacro(food)

    if (existing) {
      existing.items.push(food)
      existing.count += 1
      existing.eatenPortion += food.eatenPortion
      existing.macro.kcal += macro.kcal
      existing.macro.protein += macro.protein
      existing.macro.carbs += macro.carbs
      existing.macro.fat += macro.fat
      return groups
    }

    groups.push({
      key,
      food,
      items: [
        food,
      ],
      catalogFood: food.catalogFoodId ? catalogById.get(food.catalogFoodId) : undefined,
      count: 1,
      eatenPortion: food.eatenPortion,
      macro: {
        ...emptyMacro(),
        ...macro,
      },
    })
    return groups
  }, [])
}
