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
  after: number
  before: number
  remaining: number
  adjustable: boolean
}

export type DailyPlanMeal = {
  meal: Meal
  cells: DailyPlanCell[]
  planned: Macro
  consumed: Macro
  available: Macro
  remaining: Macro
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
  const registeredMealIds = new Set(foods.map((food) => food.mealId))
  let base = EMPTY_MACRO
  let remaining = EMPTY_MACRO

  const projectedMeals = meals.map((meal) => {
    // A registration is treated as the current reality of that meal, even if the
    // user adds more food to it later. Only meals without registrations can be
    // changed by the live compensation proposal.
    const adjustable = !registeredMealIds.has(meal.id)
    const cells = GROUPS.map((groupId) => {
      const planned = meal.exchanges[groupId] ?? 0
      const appliedValue = applied.get(keyFor(meal.id, groupId)) ?? 0
      // A saved proposal can outlive a new registration after an app refresh.
      // Never let one of those stale deltas modify an already registered meal.
      const pendingValue = adjustable ? (pending.get(keyFor(meal.id, groupId)) ?? 0) : 0
      const consumedValue = consumed.get(keyFor(meal.id, groupId)) ?? 0
      const before = Math.max(0, planned + appliedValue - consumedValue)
      const value = Math.max(0, before + pendingValue)
      const after = Math.max(0, planned + appliedValue + pendingValue)

      base = add(base, macroFor(groupId, planned))
      if (adjustable) remaining = add(remaining, macroFor(groupId, value))

      return {
        mealId: meal.id,
        groupId,
        planned,
        consumed: consumedValue,
        applied: appliedValue,
        pending: pendingValue,
        after,
        before,
        remaining: value,
        adjustable,
      }
    })

    return {
      meal,
      cells,
      planned: cells.reduce(
        (total, cell) => add(total, macroFor(cell.groupId, cell.planned)),
        EMPTY_MACRO,
      ),
      consumed: sumFoods(foods.filter((food) => food.mealId === meal.id)),
      available: cells.reduce(
        (total, cell) => add(total, macroFor(cell.groupId, cell.before)),
        EMPTY_MACRO,
      ),
      remaining: cells.reduce(
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

type RebalanceOption = {
  groupId: SmaeGroupId
  minSteps: number
  maxSteps: number
  perStep: Macro
}

type MacroBounds = {
  min: Macro
  max: Macro
}

const zeroMacro = (): Macro => ({
  kcal: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
})

const scale = (macro: Macro, value: number): Macro => ({
  kcal: macro.kcal * value,
  protein: macro.protein * value,
  carbs: macro.carbs * value,
  fat: macro.fat * value,
})

const macroBounds = (options: RebalanceOption[]): MacroBounds =>
  options.reduce<MacroBounds>(
    (bounds, option) => ({
      min: add(bounds.min, scale(option.perStep, option.minSteps)),
      max: add(bounds.max, scale(option.perStep, option.maxSteps)),
    }),
    {
      min: zeroMacro(),
      max: zeroMacro(),
    },
  )

const distanceToInterval = (value: number, min: number, max: number) => {
  if (value < min) return min - value
  if (value > max) return value - max
  return 0
}

const lowerBoundScore = (remaining: Macro, target: Macro, bounds: MacroBounds) => {
  const min = add(remaining, bounds.min)
  const max = add(remaining, bounds.max)
  return (
    (distanceToInterval(target.kcal, min.kcal, max.kcal) / Math.max(Math.abs(target.kcal), 1)) **
      2 +
    (distanceToInterval(target.protein, min.protein, max.protein) /
      Math.max(Math.abs(target.protein), 1)) **
      2 +
    (distanceToInterval(target.carbs, min.carbs, max.carbs) /
      Math.max(Math.abs(target.carbs), 1)) **
      2 +
    (distanceToInterval(target.fat, min.fat, max.fat) / Math.max(Math.abs(target.fat), 1)) ** 2
  )
}

const valuesNear = (min: number, max: number, preferred: number) =>
  Array.from(
    {
      length: max - min + 1,
    },
    (_, index) => min + index,
  ).sort((left, right) => Math.abs(left - preferred) - Math.abs(right - preferred) || left - right)

const distributePositiveSteps = (
  totalSteps: number,
  cells: DailyPlanCell[],
  mealKcal: Map<string, number>,
) => {
  const weights = cells.map((cell) => Math.max(0, mealKcal.get(cell.mealId) ?? 0))
  const totalWeight = weights.reduce((total, weight) => total + weight, 0)
  const shares = cells.map((_, index) =>
    totalWeight ? (totalSteps * weights[index]) / totalWeight : totalSteps / cells.length,
  )
  const allocated = shares.map((share) => Math.floor(share))
  let unallocated = totalSteps - allocated.reduce((total, value) => total + value, 0)
  const order = shares
    .map((share, index) => ({
      index,
      fraction: share - allocated[index],
    }))
    .sort((left, right) => right.fraction - left.fraction || left.index - right.index)

  for (let index = 0; unallocated > 0; index = (index + 1) % order.length) {
    allocated[order[index].index] += 1
    unallocated -= 1
  }

  return allocated
}

const distributeDeltas = (
  stepsByGroup: Map<SmaeGroupId, number>,
  meals: DailyPlanMeal[],
): MealExchangeDelta[] => {
  const mealKcal = new Map(
    meals.map(({ meal, remaining }) => [
      meal.id,
      remaining.kcal,
    ]),
  )
  const deltas: MealExchangeDelta[] = []

  for (const groupId of GROUPS) {
    const totalSteps = stepsByGroup.get(groupId) ?? 0
    if (!totalSteps) continue
    const cells = meals.flatMap(({ cells }) => cells.filter((cell) => cell.groupId === groupId))
    if (!cells.length) continue

    if (totalSteps > 0) {
      const allocated = distributePositiveSteps(totalSteps, cells, mealKcal)
      cells.forEach((cell, index) => {
        if (allocated[index]) {
          deltas.push({
            mealId: cell.mealId,
            groupId,
            value: allocated[index] * STEP,
          })
        }
      })
      continue
    }

    let stepsToRemove = -totalSteps
    const removable = cells
      .map((cell, index) => ({
        cell,
        index,
        availableSteps: Math.max(0, Math.floor((cell.before + EPSILON) / STEP)),
      }))
      .sort((left, right) => right.availableSteps - left.availableSteps || left.index - right.index)
    for (const entry of removable) {
      const removed = Math.min(stepsToRemove, entry.availableSteps)
      if (!removed) continue
      deltas.push({
        mealId: entry.cell.mealId,
        groupId,
        value: -removed * STEP,
      })
      stepsToRemove -= removed
      if (!stepsToRemove) break
    }
  }

  return deltas
}

export const proposeRebalance = (
  meals: Meal[],
  foods: ExternalFood[],
  appliedDeltas: MealExchangeDelta[] = [],
  allowedMealIds?: string[],
): RebalanceProposal => {
  const projection = projectDailyPlan(meals, foods, appliedDeltas)
  const allowedMeals = allowedMealIds ? new Set(allowedMealIds) : undefined
  const adjustableMeals = projection.meals.filter(
    ({ meal, cells }) => cells[0]?.adjustable && (!allowedMeals || allowedMeals.has(meal.id)),
  )
  if (!adjustableMeals.length) {
    return {
      deltas: [],
      residual: projection.residual,
    }
  }

  const options = GROUPS.map<RebalanceOption>((groupId) => {
    const availableEquivalents = adjustableMeals.reduce(
      (total, { cells }) => total + (cells.find((cell) => cell.groupId === groupId)?.before ?? 0),
      0,
    )
    return {
      groupId,
      minSteps: -Math.floor((availableEquivalents + EPSILON) / STEP),
      maxSteps: 0,
      perStep: macroFor(groupId, STEP),
    }
  })

  // A feasible incumbent gives the finite bounds needed to search every valid
  // discrete combination without imposing an arbitrary equivalent limit.
  const seedSteps = new Map(
    options.map((option) => [
      option.groupId,
      0,
    ]),
  )
  let seedRemaining = projection.remaining
  const proteinDeficit =
    projection.base.protein - (projection.consumed.protein + seedRemaining.protein)
  if (proteinDeficit > EPSILON) {
    const proteinOption = options.find((option) => option.groupId === 'aoa_very_low_fat')
    if (!proteinOption) {
      return {
        deltas: [],
        residual: projection.residual,
      }
    }
    const steps = Math.ceil(proteinDeficit / proteinOption.perStep.protein)
    seedSteps.set(proteinOption.groupId, steps)
    seedRemaining = add(seedRemaining, scale(proteinOption.perStep, steps))
  }

  let bestScore = score(seedRemaining, projection.target)
  let bestSteps = new Map(seedSteps)
  let bestMagnitude = [
    ...seedSteps.values(),
  ].reduce((total, value) => total + Math.abs(value), 0)
  const maxFinalKcal =
    projection.target.kcal +
    Math.sqrt(bestScore) * Math.max(Math.abs(projection.target.kcal), 1) +
    EPSILON

  for (const option of options) {
    const otherMinimumKcal = options
      .filter((other) => other !== option)
      .reduce((total, other) => total + other.minSteps * other.perStep.kcal, 0)
    const upper = Math.floor(
      (maxFinalKcal - projection.remaining.kcal - otherMinimumKcal) / option.perStep.kcal + EPSILON,
    )
    option.maxSteps = Math.max(option.minSteps, upper, seedSteps.get(option.groupId) ?? 0)
  }

  const orderedOptions = [
    ...options,
  ].sort(
    (left, right) =>
      right.perStep.kcal +
      right.perStep.protein +
      right.perStep.carbs +
      right.perStep.fat -
      (left.perStep.kcal + left.perStep.protein + left.perStep.carbs + left.perStep.fat),
  )
  const suffixBounds: MacroBounds[] = Array.from(
    {
      length: orderedOptions.length + 1,
    },
    () => ({
      min: zeroMacro(),
      max: zeroMacro(),
    }),
  )
  for (let index = orderedOptions.length - 1; index >= 0; index -= 1) {
    suffixBounds[index] = macroBounds(orderedOptions.slice(index))
  }

  const currentSteps = new Map<SmaeGroupId, number>()
  const search = (index: number, remaining: Macro, magnitude: number) => {
    const bounds = suffixBounds[index]
    if (
      projection.consumed.protein + remaining.protein + bounds.max.protein <
      projection.base.protein - EPSILON
    ) {
      return
    }
    if (lowerBoundScore(remaining, projection.target, bounds) > bestScore - EPSILON) return

    if (index === orderedOptions.length) {
      if (projection.consumed.protein + remaining.protein < projection.base.protein - EPSILON)
        return
      const candidateScore = score(remaining, projection.target)
      if (
        candidateScore < bestScore - EPSILON ||
        (Math.abs(candidateScore - bestScore) <= EPSILON && magnitude < bestMagnitude)
      ) {
        bestScore = candidateScore
        bestSteps = new Map(currentSteps)
        bestMagnitude = magnitude
      }
      return
    }

    const option = orderedOptions[index]
    const ideal = Math.round((projection.target.kcal - remaining.kcal) / option.perStep.kcal)
    for (const steps of valuesNear(option.minSteps, option.maxSteps, ideal)) {
      currentSteps.set(option.groupId, steps)
      search(index + 1, add(remaining, scale(option.perStep, steps)), magnitude + Math.abs(steps))
    }
    currentSteps.delete(option.groupId)
  }

  search(0, projection.remaining, 0)
  const deltas = distributeDeltas(bestSteps, adjustableMeals)
  const adjustedRemaining = deltas.reduce(
    (remaining, delta) => add(remaining, macroFor(delta.groupId, delta.value)),
    projection.remaining,
  )

  return {
    deltas,
    residual: subtract(adjustedRemaining, projection.target),
  }
}
