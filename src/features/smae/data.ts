import type { Food, Macro, SmaeGroup } from './types'

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
export const CATALOG: Food[] = [
  [
    'verdura-acelga',
    'Acelga cruda',
    'Verduras',
    '1 taza',
  ],
  [
    'verdura-brocoli',
    'Brócoli cocido',
    'Verduras',
    '½ taza',
  ],
  [
    'fruta-manzana',
    'Manzana',
    'Frutas',
    '1 pieza chica',
  ],
  [
    'fruta-platano',
    'Plátano',
    'Frutas',
    '½ pieza',
  ],
  [
    'cereal-tortilla',
    'Tortilla de maíz',
    'Cereales · sin grasa',
    '1 pieza',
  ],
  [
    'cereal-pan',
    'Pan integral',
    'Cereales · sin grasa',
    '1 rebanada',
  ],
  [
    'cereal-granola',
    'Granola',
    'Cereales · con grasa',
    '⅓ taza',
  ],
  [
    'leguminosa-frijol',
    'Frijoles de olla',
    'Leguminosas',
    '½ taza',
  ],
  [
    'aoa-pollo',
    'Pechuga de pollo',
    'AOA · muy bajo aporte de grasa',
    '30 g',
  ],
  [
    'aoa-queso',
    'Queso fresco',
    'AOA · bajo aporte de grasa',
    '40 g',
  ],
  [
    'leche-descremada',
    'Leche descremada',
    'Leche · descremada',
    '1 taza',
  ],
  [
    'leche-entera',
    'Leche entera',
    'Leche · entera',
    '1 taza',
  ],
  [
    'grasa-aceite',
    'Aceite vegetal',
    'Grasas · sin proteína',
    '1 cucharadita',
  ],
  [
    'grasa-almendra',
    'Almendras',
    'Grasas · con proteína',
    '10 piezas',
  ],
].map(([id, name, group, portion]) => ({
  id,
  name,
  group: group as SmaeGroup,
  portion,
  perExchange: GROUP_MACROS[group as SmaeGroup],
}))
