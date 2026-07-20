export type Macro = {
  kcal: number
  protein: number
  carbs: number
  fat: number
}

export const GROUP_IDS = {
  vegetables: 'vegetables',
  fruits: 'fruits',
  cerealsWithoutFat: 'cereals_without_fat',
  cerealsWithFat: 'cereals_with_fat',
  legumes: 'legumes',
  aoaVeryLowFat: 'aoa_very_low_fat',
  aoaLowFat: 'aoa_low_fat',
  aoaModerateFat: 'aoa_moderate_fat',
  aoaHighFat: 'aoa_high_fat',
  milkSkim: 'milk_skim',
  milkSemiSkim: 'milk_semi_skim',
  milkWhole: 'milk_whole',
  fatsWithoutProtein: 'fats_without_protein',
  fatsWithProtein: 'fats_with_protein',
} as const

export type SmaeGroupId = (typeof GROUP_IDS)[keyof typeof GROUP_IDS]
export type AdjustableGroupId =
  | typeof GROUP_IDS.cerealsWithoutFat
  | typeof GROUP_IDS.fatsWithoutProtein
export type SmaeGroupDefinition = {
  label: string
  macro: Macro
}

export type CatalogFood = {
  id: string
  name: string
  groupId: SmaeGroupId
  quantity: number
  unit: string
  portion: string
}
export type Food = CatalogFood & {
  perExchange: Macro
}
export type Meal = {
  id: string
  name: string
  exchanges: Partial<Record<SmaeGroupId, number>>
}
export type ExternalFood = {
  id: string
  name: string
  source?: 'smae' | 'external'
  catalogFoodId?: string
  smaeGroupId?: SmaeGroupId
  mealId: string
  mode: 'macros' | 'calories'
  referencePortion: number
  eatenPortion: number
  macro: Macro
  createdAt: string
  imageUri?: string
}
export type FoodRegistration = Omit<ExternalFood, 'id' | 'createdAt'>
export type MealExchangeDelta = {
  mealId: string
  groupId: SmaeGroupId
  value: number
}
export type Adjustment = {
  id: string
  createdAt: string
  deltas: MealExchangeDelta[]
  residual: Macro
}

export type SmaeState = {
  meals: Meal[]
  externalFoods: ExternalFood[]
  appliedAdjustments: MealExchangeDelta[]
  adjustment?: Adjustment
  setExchange: (mealId: string, groupId: SmaeGroupId, value: number) => void
  addMeal: (name: string) => void
  renameMeal: (mealId: string, name: string) => void
  removeMeal: (mealId: string) => void
  addExternal: (food: FoodRegistration) => void
  addFoods: (foods: FoodRegistration[]) => void
  proposeAdjustment: () => void
  applyAdjustment: () => void
  discardAdjustment: () => void
  resetDay: () => void
}
