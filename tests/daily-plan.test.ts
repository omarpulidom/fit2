import { expect, test } from 'bun:test'
import { proposeRebalance } from '../src/features/smae/daily-plan'
import type { ExternalFood, Meal } from '../src/features/smae/types'

const registeredFood = (
  mealId: string,
  eatenPortion: number,
  macro: ExternalFood['macro'],
): ExternalFood => ({
  id: `food-${mealId}`,
  name: 'Registro',
  source: 'smae',
  smaeGroupId: 'cereals_without_fat',
  mealId,
  mode: 'macros',
  referencePortion: 1,
  eatenPortion,
  macro,
  createdAt: '2026-01-01T00:00:00.000Z',
})

test('finds the exact reduction instead of a local approximation', () => {
  const meals: Meal[] = [
    {
      id: 'registered',
      name: 'Comida',
      exchanges: {
        cereals_without_fat: 1,
      },
    },
    {
      id: 'dinner',
      name: 'Cena',
      exchanges: {
        cereals_without_fat: 1,
        aoa_low_fat: 1,
      },
    },
  ]
  const result = proposeRebalance(
    meals,
    [
      registeredFood('registered', 1.5, {
        kcal: 70,
        protein: 2,
        carbs: 15,
        fat: 0,
      }),
    ],
    [],
    [
      'dinner',
    ],
  )

  expect(result.deltas).toEqual([
    {
      mealId: 'dinner',
      groupId: 'cereals_without_fat',
      value: -0.5,
    },
  ])
  expect(Object.values(result.residual).every((value) => Math.abs(value) < 0.001)).toBe(true)
})

test('adds a new group and never modifies a registered meal', () => {
  const meals: Meal[] = [
    {
      id: 'registered',
      name: 'Comida',
      exchanges: {
        cereals_without_fat: 1,
      },
    },
    {
      id: 'snack',
      name: 'Colación',
      exchanges: {},
    },
    {
      id: 'dinner',
      name: 'Cena',
      exchanges: {},
    },
  ]
  const result = proposeRebalance(
    meals,
    [
      registeredFood('registered', 1, {
        kcal: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      }),
    ],
    [],
    [
      'snack',
      'dinner',
    ],
  )

  expect(result.deltas).toEqual([
    {
      mealId: 'snack',
      groupId: 'cereals_without_fat',
      value: 0.5,
    },
    {
      mealId: 'dinner',
      groupId: 'cereals_without_fat',
      value: 0.5,
    },
  ])
  expect(result.deltas.some((delta) => delta.mealId === 'registered')).toBe(false)
})
