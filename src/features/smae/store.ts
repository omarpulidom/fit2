import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { zustandMMKVStorage } from '@/lib/mmkv'
import { proposeRebalance } from './daily-plan'
import type { MealExchangeDelta, SmaeState } from './types'

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
  appliedAdjustments: [] as MealExchangeDelta[],
})
const id = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`

const mergeDeltas = (current: MealExchangeDelta[], incoming: MealExchangeDelta[]) => {
  const merged = new Map<string, MealExchangeDelta>()
  for (const delta of [
    ...current,
    ...incoming,
  ]) {
    const key = `${delta.mealId}:${delta.groupId}`
    const existing = merged.get(key)
    if (existing) existing.value += delta.value
    else
      merged.set(key, {
        ...delta,
      })
  }
  return [
    ...merged.values(),
  ].filter((delta) => Math.abs(delta.value) > 0.001)
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
          appliedAdjustments: [],
          adjustment: undefined,
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
          adjustment: undefined,
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
                appliedAdjustments: (s.appliedAdjustments ?? []).filter(
                  (adjustment) => adjustment.mealId !== mealId,
                ),
                adjustment: undefined,
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
        const proposal = proposeRebalance(s.meals, s.externalFoods, s.appliedAdjustments ?? [])
        set({
          adjustment: {
            id: id(),
            createdAt: new Date().toISOString(),
            ...proposal,
          },
        })
      },
      applyAdjustment: () => {
        const adjustment = get().adjustment
        if (!adjustment) return
        set((s) => ({
          appliedAdjustments: mergeDeltas(s.appliedAdjustments ?? [], adjustment.deltas),
          adjustment: undefined,
        }))
      },
      discardAdjustment: () =>
        set({
          adjustment: undefined,
        }),
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
