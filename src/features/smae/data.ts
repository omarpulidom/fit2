import catalog from './catalog.json'
import type { CatalogFood, Food, Macro, SmaeGroup } from './types'

export const GROUP_MACROS: Record<SmaeGroup, Macro> = {
  Verduras: {
    kcal: 25,
    protein: 2,
    carbs: 4,
    fat: 0,
  },
  Frutas: {
    kcal: 60,
    protein: 0,
    carbs: 15,
    fat: 0,
  },
  'Cereales · sin grasa': {
    kcal: 70,
    protein: 2,
    carbs: 15,
    fat: 0,
  },
  'Cereales · con grasa': {
    kcal: 115,
    protein: 2,
    carbs: 15,
    fat: 5,
  },
  Leguminosas: {
    kcal: 120,
    protein: 8,
    carbs: 20,
    fat: 1,
  },
  'AOA · muy bajo aporte de grasa': {
    kcal: 40,
    protein: 7,
    carbs: 0,
    fat: 1,
  },
  'AOA · bajo aporte de grasa': {
    kcal: 55,
    protein: 7,
    carbs: 0,
    fat: 3,
  },
  'AOA · moderado aporte de grasa': {
    kcal: 75,
    protein: 7,
    carbs: 0,
    fat: 5,
  },
  'AOA · alto aporte de grasa': {
    kcal: 100,
    protein: 7,
    carbs: 0,
    fat: 8,
  },
  'Leche · descremada': {
    kcal: 95,
    protein: 9,
    carbs: 12,
    fat: 2,
  },
  'Leche · semidescremada': {
    kcal: 110,
    protein: 9,
    carbs: 12,
    fat: 4,
  },
  'Leche · entera': {
    kcal: 150,
    protein: 9,
    carbs: 12,
    fat: 8,
  },
  'Grasas · sin proteína': {
    kcal: 45,
    protein: 0,
    carbs: 0,
    fat: 5,
  },
  'Grasas · con proteína': {
    kcal: 70,
    protein: 3,
    carbs: 3,
    fat: 5,
  },
}

export const GROUPS = Object.keys(GROUP_MACROS) as SmaeGroup[]
export const CATALOG: Food[] = (catalog as CatalogFood[]).map((food) => ({
  ...food,
  perExchange: GROUP_MACROS[food.group],
}))

export const normalizeCatalogSearch = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()

export const CATALOG_BY_GROUP = GROUPS.reduce<Record<SmaeGroup, Food[]>>(
  (groups, group) => {
    groups[group] = CATALOG.filter((food) => food.group === group)
    return groups
  },
  {} as Record<SmaeGroup, Food[]>,
)

export const CATALOG_SEARCH_INDEX = CATALOG.map((food) => ({
  food,
  searchText: normalizeCatalogSearch(`${food.name} ${food.group} ${food.portion}`),
}))
