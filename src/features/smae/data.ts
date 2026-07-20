import catalog from './catalog.json'
import {
  type CatalogFood,
  type Food,
  GROUP_IDS,
  type Macro,
  type SmaeGroupDefinition,
  type SmaeGroupId,
} from './types'

export const SMAE_GROUPS: Record<SmaeGroupId, SmaeGroupDefinition> = {
  [GROUP_IDS.vegetables]: {
    label: 'Verduras',
    macro: {
      kcal: 25,
      protein: 2,
      carbs: 4,
      fat: 0,
    },
  },
  [GROUP_IDS.fruits]: {
    label: 'Frutas',
    macro: {
      kcal: 60,
      protein: 0,
      carbs: 15,
      fat: 0,
    },
  },
  [GROUP_IDS.cerealsWithoutFat]: {
    label: 'Cereales · sin grasa',
    macro: {
      kcal: 70,
      protein: 2,
      carbs: 15,
      fat: 0,
    },
  },
  [GROUP_IDS.cerealsWithFat]: {
    label: 'Cereales · con grasa',
    macro: {
      kcal: 115,
      protein: 2,
      carbs: 15,
      fat: 5,
    },
  },
  [GROUP_IDS.legumes]: {
    label: 'Leguminosas',
    macro: {
      kcal: 120,
      protein: 8,
      carbs: 20,
      fat: 1,
    },
  },
  [GROUP_IDS.aoaVeryLowFat]: {
    label: 'AOA · muy bajo en grasa',
    macro: {
      kcal: 40,
      protein: 7,
      carbs: 0,
      fat: 1,
    },
  },
  [GROUP_IDS.aoaLowFat]: {
    label: 'AOA · bajo en grasa',
    macro: {
      kcal: 55,
      protein: 7,
      carbs: 0,
      fat: 3,
    },
  },
  [GROUP_IDS.aoaModerateFat]: {
    label: 'AOA · moderado en grasa',
    macro: {
      kcal: 75,
      protein: 7,
      carbs: 0,
      fat: 5,
    },
  },
  [GROUP_IDS.aoaHighFat]: {
    label: 'AOA · alto en grasa',
    macro: {
      kcal: 100,
      protein: 7,
      carbs: 0,
      fat: 8,
    },
  },
  [GROUP_IDS.milkSkim]: {
    label: 'Leche · descremada',
    macro: {
      kcal: 95,
      protein: 9,
      carbs: 12,
      fat: 2,
    },
  },
  [GROUP_IDS.milkSemiSkim]: {
    label: 'Leche · semidescremada',
    macro: {
      kcal: 110,
      protein: 9,
      carbs: 12,
      fat: 4,
    },
  },
  [GROUP_IDS.milkWhole]: {
    label: 'Leche · entera',
    macro: {
      kcal: 150,
      protein: 9,
      carbs: 12,
      fat: 8,
    },
  },
  [GROUP_IDS.fatsWithoutProtein]: {
    label: 'Grasas · sin proteína',
    macro: {
      kcal: 45,
      protein: 0,
      carbs: 0,
      fat: 5,
    },
  },
  [GROUP_IDS.fatsWithProtein]: {
    label: 'Grasas · con proteína',
    macro: {
      kcal: 70,
      protein: 3,
      carbs: 3,
      fat: 5,
    },
  },
}

export const GROUPS = Object.values(GROUP_IDS) as SmaeGroupId[]
export const GROUP_MACROS: Record<SmaeGroupId, Macro> = Object.fromEntries(
  GROUPS.map((groupId) => [
    groupId,
    SMAE_GROUPS[groupId].macro,
  ]),
) as Record<SmaeGroupId, Macro>
export const getGroupLabel = (groupId: SmaeGroupId) => SMAE_GROUPS[groupId].label
export const CATALOG: Food[] = (catalog as CatalogFood[]).map((food) => ({
  ...food,
  perExchange: GROUP_MACROS[food.groupId],
}))

export const normalizeCatalogSearch = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

const EMPTY_CATALOG_BY_GROUP = GROUPS.reduce<Record<SmaeGroupId, Food[]>>(
  (groups, groupId) => {
    groups[groupId] = []
    return groups
  },
  {} as Record<SmaeGroupId, Food[]>,
)

export const CATALOG_BY_GROUP = CATALOG.reduce<Record<SmaeGroupId, Food[]>>((groups, food) => {
  groups[food.groupId].push(food)
  return groups
}, EMPTY_CATALOG_BY_GROUP)

export const CATALOG_SEARCH_INDEX = CATALOG.map((food) => ({
  food,
  searchText: normalizeCatalogSearch(`${food.name} ${food.portion}`),
}))
