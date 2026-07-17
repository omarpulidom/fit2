export type Macro = {
  kcal: number
  protein: number
  carbs: number
  fat: number
}

export type SmaeGroup =
  | 'Verduras'
  | 'Frutas'
  | 'Cereales · sin grasa'
  | 'Cereales · con grasa'
  | 'Leguminosas'
  | 'AOA · muy bajo aporte de grasa'
  | 'AOA · bajo aporte de grasa'
  | 'AOA · moderado aporte de grasa'
  | 'AOA · alto aporte de grasa'
  | 'Leche · descremada'
  | 'Leche · semidescremada'
  | 'Leche · entera'
  | 'Grasas · sin proteína'
  | 'Grasas · con proteína'

export type Food = {
  id: string
  name: string
  group: SmaeGroup
  portion: string
  perExchange: Macro
}
export type Meal = {
  id: string
  name: string
  exchanges: Partial<Record<SmaeGroup, number>>
}
export type ExternalFood = {
  id: string
  name: string
  mealId: string
  mode: 'macros' | 'calories'
  referencePortion: number
  eatenPortion: number
  macro: Macro
  createdAt: string
  imageUri?: string
}
export type Adjustment = {
  id: string
  createdAt: string
  delta: Partial<Record<'Cereales · sin grasa' | 'Grasas · sin proteína', number>>
  unassignedKcal: number
  remainingKcal: number
  status: 'pending' | 'applied'
}

export type SmaeState = {
  meals: Meal[]
  catalog: Food[]
  externalFoods: ExternalFood[]
  adjustment?: Adjustment
  setExchange: (mealId: string, group: SmaeGroup, value: number) => void
  addMeal: (name: string) => void
  renameMeal: (mealId: string, name: string) => void
  removeMeal: (mealId: string) => void
  addExternal: (food: Omit<ExternalFood, 'id' | 'createdAt'>) => void
  proposeAdjustment: () => void
  applyAdjustment: () => void
  resetDay: () => void
}
