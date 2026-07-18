import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { zustandMMKVStorage } from '@/lib/mmkv'
import { GROUP_MACROS } from './data'
import type { SmaeState } from './types'

const mealNames = [
  'Desayuno',
  'Colación 1',
  'Comida',
  'Colación 2',
  'Cena',
]
const initial = () => ({
  meals: mealNames.map((name, i) => ({
    id: `meal-${i}`,
    name,
    exchanges: {},
  })),
  externalFoods: [],
})
const id = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`

const migrateExchanges = (exchanges: Record<string, number> = {}) => {
  const renamed: Record<string, string> = {
    'Cereales sin grasa': 'Cereales · sin grasa',
    'Cereales y tubérculos · sin grasa': 'Cereales · sin grasa',
    'Cereales y tubérculos · con grasa': 'Cereales · con grasa',
    'Grasas sin proteína': 'Grasas · sin proteína',
    'Aceites y grasas · sin proteína': 'Grasas · sin proteína',
    'Aceites y grasas · con proteína': 'Grasas · con proteína',
  }
  return Object.entries(exchanges).reduce<Record<string, number>>(
    (result, [group, value]) => ({
      ...result,
      [renamed[group] ?? group]: value,
    }),
    {},
  )
}

export const useSmaeStore = create<SmaeState>()(
  persist(
    (set, get) => ({
      ...initial(),
      setExchange: (mealId, group, value) =>
        set((s) => ({
          meals: s.meals.map((m) =>
            m.id === mealId
              ? {
                  ...m,
                  exchanges: {
                    ...m.exchanges,
                    [group]: Math.max(0, value || 0),
                  },
                }
              : m,
          ),
        })),
      addMeal: (name) =>
        set((s) => ({
          meals: [
            ...s.meals,
            {
              id: id(),
              name,
              exchanges: {},
            },
          ],
        })),
      renameMeal: (mealId, name) =>
        set((s) => ({
          meals: s.meals.map((m) =>
            m.id === mealId
              ? {
                  ...m,
                  name: name.trim() || m.name,
                }
              : m,
          ),
        })),
      removeMeal: (mealId) =>
        set((s) =>
          s.meals.length <= 1
            ? s
            : {
                meals: s.meals.filter((m) => m.id !== mealId),
                externalFoods: s.externalFoods.filter((f) => f.mealId !== mealId),
              },
        ),
      addExternal: (food) =>
        set((s) => ({
          externalFoods: [
            ...s.externalFoods,
            {
              ...food,
              id: id(),
              createdAt: new Date().toISOString(),
            },
          ],
          adjustment: undefined,
        })),
      proposeAdjustment: () => {
        const s = get()
        const fromExternals = s.externalFoods.reduce(
          (a, f) => ({
            kcal: a.kcal + (f.macro.kcal * f.eatenPortion) / f.referencePortion,
            protein: a.protein + (f.macro.protein * f.eatenPortion) / f.referencePortion,
            carbs: a.carbs + (f.macro.carbs * f.eatenPortion) / f.referencePortion,
            fat: a.fat + (f.macro.fat * f.eatenPortion) / f.referencePortion,
          }),
          {
            kcal: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
          },
        )
        const unassigned = Math.max(
          0,
          fromExternals.kcal -
            (fromExternals.protein * 4 + fromExternals.carbs * 4 + fromExternals.fat * 9),
        )
        let remaining = unassigned
        const planned = (g: 'Cereales · sin grasa' | 'Grasas · sin proteína') =>
          s.meals.reduce((n, m) => n + (m.exchanges[g] ?? 0), 0)
        const cereal = Math.min(
          planned('Cereales · sin grasa'),
          remaining / GROUP_MACROS['Cereales · sin grasa'].kcal,
        )
        remaining -= cereal * 70
        const fat = Math.min(
          planned('Grasas · sin proteína'),
          remaining / GROUP_MACROS['Grasas · sin proteína'].kcal,
        )
        remaining -= fat * 45
        set({
          adjustment: {
            id: id(),
            createdAt: new Date().toISOString(),
            delta: {
              'Cereales · sin grasa': -cereal,
              'Grasas · sin proteína': -fat,
            },
            unassignedKcal: unassigned,
            remainingKcal: Math.max(0, remaining),
            status: 'pending',
          },
        })
      },
      applyAdjustment: () => {
        const a = get().adjustment
        if (!a || a.status !== 'pending') return
        let leftC = -(a.delta['Cereales · sin grasa'] ?? 0),
          leftF = -(a.delta['Grasas · sin proteína'] ?? 0)
        set((s) => ({
          adjustment: {
            ...a,
            status: 'applied',
          },
          meals: s.meals.map((m) => {
            const c = Math.min(leftC, m.exchanges['Cereales · sin grasa'] ?? 0)
            leftC -= c
            const f = Math.min(leftF, m.exchanges['Grasas · sin proteína'] ?? 0)
            leftF -= f
            return {
              ...m,
              exchanges: {
                ...m.exchanges,
                'Cereales · sin grasa': (m.exchanges['Cereales · sin grasa'] ?? 0) - c,
                'Grasas · sin proteína': (m.exchanges['Grasas · sin proteína'] ?? 0) - f,
              },
            }
          }),
        }))
      },
      resetDay: () =>
        set({
          ...initial(),
          adjustment: undefined,
        }),
    }),
    {
      name: 'smae-v1',
      version: 3,
      storage: createJSONStorage(() => zustandMMKVStorage),
      migrate: (persistedState: unknown) => {
        const { catalog: _catalog, ...state } = persistedState as Partial<SmaeState> & {
          catalog?: unknown
        }
        if (!state.meals) return state as SmaeState
        const renamedMeals = state.meals.map((meal) => ({
          ...meal,
          name: meal.name === 'Colación' ? 'Colación 1' : meal.name,
          exchanges: migrateExchanges(meal.exchanges as Record<string, number>),
        }))
        const hasSecondSnack = renamedMeals.some((meal) => meal.name === 'Colación 2')
        const dinnerIndex = renamedMeals.findIndex((meal) => meal.name === 'Cena')
        if (!hasSecondSnack)
          renamedMeals.splice(dinnerIndex < 0 ? renamedMeals.length : dinnerIndex, 0, {
            id: 'meal-colacion-2',
            name: 'Colación 2',
            exchanges: {},
          })
        return {
          ...state,
          meals: renamedMeals,
        } as SmaeState
      },
    },
  ),
)
