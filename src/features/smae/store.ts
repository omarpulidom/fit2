import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { zustandMMKVStorage } from '@/lib/mmkv'
import { GROUP_MACROS } from './data'
import { GROUP_IDS, type SmaeState } from './types'

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
        get().addFoods([
          food,
        ]),
      addFoods: (foods) =>
        set((s) => ({
          externalFoods: [
            ...s.externalFoods,
            ...foods.map((food) => ({
              ...food,
              id: id(),
              createdAt: new Date().toISOString(),
            })),
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
        const planned = (
          groupId: typeof GROUP_IDS.cerealsWithoutFat | typeof GROUP_IDS.fatsWithoutProtein,
        ) => s.meals.reduce((n, m) => n + (m.exchanges[groupId] ?? 0), 0)
        const cereal = Math.min(
          planned(GROUP_IDS.cerealsWithoutFat),
          remaining / GROUP_MACROS[GROUP_IDS.cerealsWithoutFat].kcal,
        )
        remaining -= cereal * 70
        const fat = Math.min(
          planned(GROUP_IDS.fatsWithoutProtein),
          remaining / GROUP_MACROS[GROUP_IDS.fatsWithoutProtein].kcal,
        )
        remaining -= fat * 45
        set({
          adjustment: {
            id: id(),
            createdAt: new Date().toISOString(),
            delta: {
              [GROUP_IDS.cerealsWithoutFat]: -cereal,
              [GROUP_IDS.fatsWithoutProtein]: -fat,
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
        let leftC = -(a.delta[GROUP_IDS.cerealsWithoutFat] ?? 0),
          leftF = -(a.delta[GROUP_IDS.fatsWithoutProtein] ?? 0)
        set((s) => ({
          adjustment: {
            ...a,
            status: 'applied',
          },
          meals: s.meals.map((m) => {
            const c = Math.min(leftC, m.exchanges[GROUP_IDS.cerealsWithoutFat] ?? 0)
            leftC -= c
            const f = Math.min(leftF, m.exchanges[GROUP_IDS.fatsWithoutProtein] ?? 0)
            leftF -= f
            return {
              ...m,
              exchanges: {
                ...m.exchanges,
                [GROUP_IDS.cerealsWithoutFat]: (m.exchanges[GROUP_IDS.cerealsWithoutFat] ?? 0) - c,
                [GROUP_IDS.fatsWithoutProtein]:
                  (m.exchanges[GROUP_IDS.fatsWithoutProtein] ?? 0) - f,
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
      name: 'smae-v2',
      storage: createJSONStorage(() => zustandMMKVStorage),
    },
  ),
)
