import { GROUP_MACROS, GROUPS } from './data'
import type { ExternalFood, Macro, Meal, MealExchangeDelta, SmaeGroupId } from './types'

const EMPTY_MACRO: Macro = {
  kcal: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
}
const STEP = 0.5
const EPSILON = 0.001

export type DailyPlanCell = {
  mealId: string
  groupId: SmaeGroupId
  planned: number
  consumed: number
  applied: number
  pending: number
  before: number
  remaining: number
}

export type DailyPlanMeal = {
  meal: Meal
  cells: DailyPlanCell[]
  macro: Macro
}

export type DailyPlanProjection = {
  base: Macro
  consumed: Macro
  target: Macro
  remaining: Macro
  residual: Macro
  meals: DailyPlanMeal[]
  groups: SmaeGroupId[]
}

export type RebalanceProposal = {
  deltas: MealExchangeDelta[]
  residual: Macro
}

const add = (left: Macro, right: Macro): Macro => ({
  kcal: left.kcal + right.kcal,
  protein: left.protein + right.protein,
  carbs: left.carbs + right.carbs,
  fat: left.fat + right.fat,
})

const subtract = (left: Macro, right: Macro): Macro => ({
  kcal: left.kcal - right.kcal,
  protein: left.protein - right.protein,
  carbs: left.carbs - right.carbs,
  fat: left.fat - right.fat,
})

const macroFor = (groupId: SmaeGroupId, equivalents: number): Macro => {
  const macro = GROUP_MACROS[groupId]
  return {
    kcal: macro.kcal * equivalents,
    protein: macro.protein * equivalents,
    carbs: macro.carbs * equivalents,
    fat: macro.fat * equivalents,
  }
}

const scaledMacro = (food: ExternalFood): Macro => {
  const scale = food.eatenPortion / food.referencePortion
  return {
    kcal: food.macro.kcal * scale,
    protein: food.macro.protein * scale,
    carbs: food.macro.carbs * scale,
    fat: food.macro.fat * scale,
  }
}

const keyFor = (mealId: string, groupId: SmaeGroupId) => `${mealId}:${groupId}`

const deltaMap = (deltas: MealExchangeDelta[]) =>
  deltas.reduce<Map<string, number>>((result, delta) => {
    const key = keyFor(delta.mealId, delta.groupId)
    result.set(key, (result.get(key) ?? 0) + delta.value)
    return result
  }, new Map())

const consumedMap = (foods: ExternalFood[]) =>
  foods.reduce<Map<string, number>>((result, food) => {
    if (food.source !== 'smae' || !food.smaeGroupId) return result
    const key = keyFor(food.mealId, food.smaeGroupId)
    result.set(key, (result.get(key) ?? 0) + food.eatenPortion)
    return result
  }, new Map())

const sumFoods = (foods: ExternalFood[]) =>
  foods.reduce((total, food) => add(total, scaledMacro(food)), EMPTY_MACRO)

const relevantGroups = (meals: DailyPlanMeal[]) =>
  GROUPS.filter((groupId) =>
    meals.some(({ cells }) =>
      cells.find(
        (cell) =>
          cell.groupId === groupId &&
          (cell.planned || cell.consumed || cell.applied || cell.pending),
      ),
    ),
  )

export const projectDailyPlan = (
  meals: Meal[],
  foods: ExternalFood[],
  appliedDeltas: MealExchangeDelta[] = [],
  pendingDeltas: MealExchangeDelta[] = [],
): DailyPlanProjection => {
  const applied = deltaMap(appliedDeltas)
  const pending = deltaMap(pendingDeltas)
  const consumed = consumedMap(foods)
  let base = EMPTY_MACRO
  let remaining = EMPTY_MACRO

  const projectedMeals = meals.map((meal) => {
    const cells = GROUPS.map((groupId) => {
      const planned = meal.exchanges[groupId] ?? 0
      const appliedValue = applied.get(keyFor(meal.id, groupId)) ?? 0
      const pendingValue = pending.get(keyFor(meal.id, groupId)) ?? 0
      const consumedValue = consumed.get(keyFor(meal.id, groupId)) ?? 0
      const before = Math.max(0, planned + appliedValue - consumedValue)
      const value = Math.max(0, before + pendingValue)

      base = add(base, macroFor(groupId, planned))
      remaining = add(remaining, macroFor(groupId, value))

      return {
        mealId: meal.id,
        groupId,
        planned,
        consumed: consumedValue,
        applied: appliedValue,
        pending: pendingValue,
        before,
        remaining: value,
      }
    })

    return {
      meal,
      cells,
      macro: cells.reduce(
        (total, cell) => add(total, macroFor(cell.groupId, cell.remaining)),
        EMPTY_MACRO,
      ),
    }
  })

  const totalConsumed = sumFoods(foods)
  const target = subtract(base, totalConsumed)
  const residual = subtract(remaining, target)

  return {
    base,
    consumed: totalConsumed,
    target,
    remaining,
    residual,
    meals: projectedMeals,
    groups: relevantGroups(projectedMeals),
  }
}

const score = (remaining: Macro, target: Macro) => {
  const residual = subtract(remaining, target)
  return (
    (residual.kcal / Math.max(Math.abs(target.kcal), 1)) ** 2 +
    (residual.protein / Math.max(Math.abs(target.protein), 1)) ** 2 +
    (residual.carbs / Math.max(Math.abs(target.carbs), 1)) ** 2 +
    (residual.fat / Math.max(Math.abs(target.fat), 1)) ** 2
  )
}

export const proposeRebalance = (
  meals: Meal[],
  foods: ExternalFood[],
  appliedDeltas: MealExchangeDelta[] = [],
): RebalanceProposal => {
  const projection = projectDailyPlan(meals, foods, appliedDeltas)
  const deltas: MealExchangeDelta[] = []
  let remaining = projection.remaining
  let currentScore = score(remaining, projection.target)
  const available = projection.meals.flatMap(({ cells }) =>
    cells.filter((cell) => cell.before >= STEP),
  )

  for (let iteration = 0; iteration < 1_000; iteration += 1) {
    let candidate: DailyPlanCell | undefined
    let candidateScore = currentScore

    for (const cell of available) {
      const alreadyRemoved = -(
        deltas.find((delta) => delta.mealId === cell.mealId && delta.groupId === cell.groupId)
          ?.value ?? 0
      )
      if (cell.before - alreadyRemoved < STEP - EPSILON) continue

      const next = subtract(remaining, macroFor(cell.groupId, STEP))
      const nextScore = score(next, projection.target)
      if (nextScore < candidateScore - EPSILON) {
        candidate = cell
        candidateScore = nextScore
      }
    }

    if (!candidate) break
    const existing = deltas.find(
      (delta) => delta.mealId === candidate.mealId && delta.groupId === candidate.groupId,
    )
    if (existing) existing.value -= STEP
    else {
      deltas.push({
        mealId: candidate.mealId,
        groupId: candidate.groupId,
        value: -STEP,
      })
    }
    remaining = subtract(remaining, macroFor(candidate.groupId, STEP))
    currentScore = candidateScore
  }

  return {
    deltas,
    residual: subtract(remaining, projection.target),
  }
}
