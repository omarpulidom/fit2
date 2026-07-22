import { Feather } from '@expo/vector-icons'
import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  DevSettings,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppBottomSheet } from '@/components/Elements/AppBottomSheet'
import { WARNING_CLEAR_ALL_MMKVS_INSTANCES } from '@/lib/mmkv/stores'
import { type DailyPlanCell, projectDailyPlan } from '@/features/smae/daily-plan'
import { GROUP_MACROS, GROUPS, getGroupLabel } from '@/features/smae/data'
import { useSmaeStore } from '@/features/smae/store'
import { GROUP_IDS, type Macro, type Meal, type SmaeGroupId } from '@/features/smae/types'

const number = (value: number) => `${Number(value.toFixed(1))}`
const MEAL_EXCHANGE_GROUPS = GROUPS.filter(
  (groupId) => groupId !== GROUP_IDS.cerealsWithFat && groupId !== GROUP_IDS.aoaHighFat,
)

export default function PlanTab() {
  const {
    meals,
    externalFoods,
    appliedAdjustments,
    appliedAdjustmentAt,
    adjustment,
    setExchange,
    addMeal,
    renameMeal,
    removeMeal,
    proposeAdjustment,
    applyAdjustment,
    discardAdjustment,
    resetDay,
  } = useSmaeStore()
  const [editing, setEditing] = useState(false)
  const [managerOpen, setManagerOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const activeAdjustment = adjustment?.deltas ? adjustment : undefined
  const projection = useMemo(
    () => projectDailyPlan(meals, externalFoods, appliedAdjustments, activeAdjustment?.deltas),
    [
      activeAdjustment?.deltas,
      appliedAdjustments,
      externalFoods,
      meals,
    ],
  )
  const hasImbalance = Object.values(projection.residual).some((value) => Math.abs(value) > 0.1)
  const hasChangesSinceApplied = Boolean(
    appliedAdjustmentAt &&
      externalFoods.some(
        (food) => new Date(food.createdAt).getTime() > new Date(appliedAdjustmentAt).getTime(),
      ),
  )

  const askResetDay = () =>
    Alert.alert(
      'Reiniciar día',
      'Se borrarán los alimentos registrados y se conservarán tus comidas y equivalentes.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Reiniciar',
          style: 'destructive',
          onPress: resetDay,
        },
      ],
    )

  const askClearMMKV = () =>
    Alert.alert(
      'Borrar datos locales',
      'Esto eliminará todos los datos guardados en MMKV y reiniciará la app. Solo úsalo durante desarrollo.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Borrar todo',
          style: 'destructive',
          onPress: () => {
            WARNING_CLEAR_ALL_MMKVS_INSTANCES()
            DevSettings.reload()
          },
        },
      ],
    )

  return (
    <SafeAreaView
      className='flex-1 bg-[#f7f7f5]'
      edges={[
        'top',
        'left',
        'right',
      ]}
    >
      {editing ? (
        <PlanEditor
          meals={meals}
          setExchange={setExchange}
          close={() => setEditing(false)}
          openManager={() => setManagerOpen(true)}
        />
      ) : (
        <DailyPlanView
          projection={projection}
          hasImbalance={hasImbalance}
          adjustment={activeAdjustment}
          hasAppliedAdjustment={appliedAdjustments.length > 0}
          hasChangesSinceApplied={hasChangesSinceApplied}
          openEditor={() => setEditing(true)}
          proposeAdjustment={proposeAdjustment}
          applyAdjustment={applyAdjustment}
          discardAdjustment={discardAdjustment}
          resetDay={askResetDay}
          clearMMKV={askClearMMKV}
        />
      )}
      <MealManager
        visible={managerOpen}
        close={() => setManagerOpen(false)}
        meals={meals}
        newName={newName}
        setNewName={setNewName}
        addMeal={addMeal}
        renameMeal={renameMeal}
        removeMeal={removeMeal}
      />
    </SafeAreaView>
  )
}

type DailyPlanViewProps = {
  projection: ReturnType<typeof projectDailyPlan>
  hasImbalance: boolean
  adjustment: ReturnType<typeof useSmaeStore.getState>['adjustment']
  hasAppliedAdjustment: boolean
  hasChangesSinceApplied: boolean
  openEditor: () => void
  proposeAdjustment: (mealIds?: string[]) => void
  applyAdjustment: () => void
  discardAdjustment: () => void
  resetDay: () => void
  clearMMKV: () => void
}

function DailyPlanView({
  projection,
  hasImbalance,
  adjustment,
  hasAppliedAdjustment,
  hasChangesSinceApplied,
  openEditor,
  proposeAdjustment,
  applyAdjustment,
  discardAdjustment,
  resetDay,
  clearMMKV,
}: DailyPlanViewProps) {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName='pb-6'>
      <View className='px-6 pt-4'>
        <View className='flex-row justify-between items-start'>
          <View>
            <Text className='font-geist-mono text-sm tracking-widest text-zinc-500'>
              PLAN DEL DÍA
            </Text>
            <Text className='font-geist-mono text-3xl text-zinc-950 mt-1'>Equivalentes</Text>
          </View>
          <TouchableOpacity
            onPress={openEditor}
            className='border border-zinc-300 rounded-full px-3 py-2 flex-row gap-2'
          >
            <Feather name='edit-3' size={14} color='#3f3f46' />
            <Text className='font-geist-mono text-sm text-zinc-800'>Editar plan</Text>
          </TouchableOpacity>
        </View>
        <Text className='font-geist-mono text-base text-zinc-500 mt-4'>
          Consulta lo pendiente por comida. Los cambios se muestran antes de aplicarse.
        </Text>
      </View>

      <View className='mx-5 mt-5 bg-zinc-950 rounded-3xl p-5'>
        <Text className='font-geist-mono text-sm tracking-widest text-zinc-400'>
          RESTANTE DEL DÍA
        </Text>
        <MacroLine values={projection.remaining} light />
      </View>

      <View className='mt-5'>
        <View className='px-6 mb-3'>
          <Text className='font-geist-mono text-lg tracking-widest text-zinc-950'>
            VISTA GENERAL
          </Text>
          <Text className='font-geist-mono text-sm text-zinc-500 mt-1'>
            Saldo pendiente por grupo y comida.
          </Text>
        </View>
        <PlanMatrix projection={projection} />
      </View>

      <View className='mx-5 mt-5'>
        <Text className='font-geist-mono text-lg tracking-widest text-zinc-950'>POR COMIDA</Text>
        {projection.meals.map((meal) => (
          <MealPlanCard key={meal.meal.id} meal={meal} />
        ))}
      </View>

      <PlanSummaryCard projection={projection} />

      <AdjustmentPanel
        adjustment={adjustment}
        hasAppliedAdjustment={hasAppliedAdjustment}
        hasChangesSinceApplied={hasChangesSinceApplied}
        hasImbalance={hasImbalance}
        projection={projection}
        proposeAdjustment={proposeAdjustment}
        applyAdjustment={applyAdjustment}
        discardAdjustment={discardAdjustment}
      />

      <View className='mx-5 mt-5'>
        <TouchableOpacity
          onPress={resetDay}
          className='border border-zinc-300 rounded-full px-4 py-3 flex-row items-center justify-center gap-2'
        >
          <Feather name='rotate-ccw' size={15} color='#52525b' />
          <Text className='font-geist-mono text-sm text-zinc-600'>Reiniciar día</Text>
        </TouchableOpacity>
        {__DEV__ && (
          <TouchableOpacity
            onPress={clearMMKV}
            className='mt-3 border border-red-200 rounded-full px-4 py-3 flex-row items-center justify-center gap-2'
          >
            <Feather name='trash-2' size={15} color='#b91c1c' />
            <Text className='font-geist-mono text-sm text-red-700'>DEV · Borrar datos locales</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  )
}

function PlanSummaryCard({ projection }: { projection: ReturnType<typeof projectDailyPlan> }) {
  return (
    <View className='mx-5 mt-5 bg-zinc-950 rounded-3xl p-5'>
      <Text className='font-geist-mono text-lg tracking-widest text-zinc-400'>RESUMEN TOTAL</Text>
      <View className='mt-4'>
        {projection.meals.map(({ meal, cells }) => (
          <View key={meal.id} className='pb-4 mb-4 border-b border-zinc-700'>
            <Text className='font-geist-mono text-base text-white'>{meal.name}</Text>
            <MacroLine values={plannedMacro(cells)} light />
          </View>
        ))}
        <View>
          <Text className='font-geist-mono text-base text-white'>TOTAL DEL DÍA</Text>
          <MacroLine values={projection.base} light />
        </View>
      </View>
    </View>
  )
}

function plannedMacro(cells: DailyPlanCell[]): Macro {
  return cells.reduce<Macro>(
    (total, cell) => {
      const macro = GROUP_MACROS[cell.groupId]
      return {
        kcal: total.kcal + macro.kcal * cell.planned,
        protein: total.protein + macro.protein * cell.planned,
        carbs: total.carbs + macro.carbs * cell.planned,
        fat: total.fat + macro.fat * cell.planned,
      }
    },
    {
      kcal: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    },
  )
}

function PlanMatrix({ projection }: { projection: ReturnType<typeof projectDailyPlan> }) {
  if (projection.groups.length === 0) {
    return (
      <View className='mx-5 bg-white border border-zinc-100 rounded-3xl p-5'>
        <Text className='font-geist-mono text-base text-zinc-500'>
          Aún no hay equivalentes configurados. Edita tu plan para comenzar a ver el saldo por grupo
          y comida.
        </Text>
      </View>
    )
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName='px-5 pb-1'
    >
      <View className='bg-white border border-zinc-100 rounded-3xl overflow-hidden'>
        <View className='flex-row bg-zinc-50'>
          <View className='w-40 px-4 py-3 border-r border-zinc-100'>
            <Text className='font-geist-mono text-xs tracking-widest text-zinc-500'>GRUPO</Text>
          </View>
          {projection.meals.map(({ meal }) => (
            <View key={meal.id} className='w-28 px-3 py-3 border-r border-zinc-100'>
              <Text className='font-geist-mono text-xs text-zinc-600' numberOfLines={1}>
                {meal.name}
              </Text>
            </View>
          ))}
        </View>
        {projection.groups.map((groupId) => (
          <View key={groupId} className='flex-row border-t border-zinc-100'>
            <View className='w-40 px-4 py-3 border-r border-zinc-100 justify-center'>
              <Text className='font-geist-mono text-sm text-zinc-800'>
                {getGroupLabel(groupId)}
              </Text>
            </View>
            {projection.meals.map(({ meal, cells }) => (
              <MatrixCell
                key={meal.id}
                cell={cells.find((cell) => cell.groupId === groupId) as DailyPlanCell}
              />
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

function MatrixCell({ cell }: { cell: DailyPlanCell }) {
  const transition = cellTransition(cell)
  const unplannedConsumption = cell.planned === 0 && cell.consumed > 0
  return (
    <View className='w-28 px-3 py-3 border-r border-zinc-100 min-h-14 justify-center'>
      <Text className={`font-geist-mono text-sm ${transition ? 'text-zinc-950' : 'text-zinc-600'}`}>
        {transition
          ? `${number(transition.from)} → ${number(transition.to)}`
          : number(cell.remaining)}
      </Text>
      {unplannedConsumption && (
        <Text className='font-geist-mono text-xs text-zinc-400 mt-1'>
          +{number(cell.consumed)} cons.
        </Text>
      )}
    </View>
  )
}

function MealPlanCard({ meal }: { meal: ReturnType<typeof projectDailyPlan>['meals'][number] }) {
  const cells = meal.cells.filter(
    (cell) => cell.planned || cell.consumed || cell.applied || cell.pending,
  )
  return (
    <View className='bg-white rounded-3xl border border-zinc-100 p-5 mt-3'>
      <View className='flex-row justify-between items-start mb-3'>
        <Text className='font-geist-mono-medium text-base text-zinc-950'>{meal.meal.name}</Text>
        <Text className='font-geist-mono text-xs tracking-widest text-zinc-400'>
          {cells.length} GRUPOS
        </Text>
      </View>
      {cells.length ? (
        cells.map((cell) => <MealPlanRow key={cell.groupId} cell={cell} />)
      ) : (
        <Text className='font-geist-mono text-sm text-zinc-500'>
          Sin equivalentes configurados.
        </Text>
      )}
    </View>
  )
}

function MealPlanRow({ cell }: { cell: DailyPlanCell }) {
  const transition = cellTransition(cell)
  return (
    <View className='flex-row justify-between items-center py-2 border-t border-zinc-100'>
      <View className='flex-1 pr-3'>
        <Text className='font-geist-mono text-sm text-zinc-800'>{getGroupLabel(cell.groupId)}</Text>
        <Text className='font-geist-mono text-xs text-zinc-400 mt-1'>
          Plan {number(cell.planned)} · Consumido {number(cell.consumed)}
        </Text>
      </View>
      <Text className='font-geist-mono text-sm text-zinc-950'>
        {transition
          ? `${number(transition.from)} → ${number(transition.to)}`
          : number(cell.remaining)}{' '}
        eq
      </Text>
    </View>
  )
}

function cellTransition(cell: DailyPlanCell) {
  if (Math.abs(cell.applied) > 0.001 || Math.abs(cell.pending) > 0.001) {
    return {
      from: cell.planned,
      to: cell.after,
    }
  }
  return undefined
}

type AdjustmentPanelProps = {
  adjustment: ReturnType<typeof useSmaeStore.getState>['adjustment']
  hasAppliedAdjustment: boolean
  hasChangesSinceApplied: boolean
  hasImbalance: boolean
  projection: ReturnType<typeof projectDailyPlan>
  proposeAdjustment: (mealIds?: string[]) => void
  applyAdjustment: () => void
  discardAdjustment: () => void
}

function AdjustmentPanel({
  adjustment,
  hasAppliedAdjustment,
  hasChangesSinceApplied,
  hasImbalance,
  projection,
  proposeAdjustment,
  applyAdjustment,
  discardAdjustment,
}: AdjustmentPanelProps) {
  const changedMeals = projection.meals.filter(({ cells }) =>
    cells.some((cell) => Math.abs(cell.pending) > 0.001),
  )
  const hasProposalDeltas = changedMeals.length > 0
  const registeredMeals = projection.meals
    .map(({ meal, planned, consumed }) => ({
      meal,
      planned,
      consumed,
      imbalance: absoluteMacro(subtractMacro(consumed, planned)),
    }))
    .filter(({ consumed }) => hasMacroValue(consumed))
  const adjustableCells = projection.meals.flatMap(({ cells }) =>
    cells.filter((cell) => cell.adjustable),
  )
  const compensableMeals = useMemo(
    () =>
      projection.meals.filter(
        ({ cells }) =>
          cells.some((cell) => cell.adjustable) &&
          cells.some((cell) => cell.planned > 0 || Math.abs(cell.applied) > 0.001),
      ),
    [
      projection.meals,
    ],
  )
  const [selectedMealIds, setSelectedMealIds] = useState<string[]>([])
  const showAppliedSummary = hasAppliedAdjustment && !hasChangesSinceApplied && !adjustment
  const canCreateProposal = selectedMealIds.length > 0

  useEffect(() => {
    const compensableMealIds = new Set(compensableMeals.map(({ meal }) => meal.id))
    setSelectedMealIds((current) => current.filter((mealId) => compensableMealIds.has(mealId)))
  }, [
    compensableMeals,
  ])

  const toggleCompensableMeal = (mealId: string) =>
    setSelectedMealIds((current) =>
      current.includes(mealId)
        ? current.filter((selectedMealId) => selectedMealId !== mealId)
        : [
            ...current,
            mealId,
          ],
    )

  return (
    <View className='mx-5 mt-5 bg-zinc-950 rounded-3xl p-5'>
      <View className='flex-row items-center justify-between gap-3'>
        <Text className='font-geist-mono text-lg tracking-widest text-white'>REAJUSTE</Text>
        {showAppliedSummary && (
          <View className='bg-emerald-400/15 border border-emerald-400/30 rounded-full px-2.5 py-1'>
            <Text className='font-geist-mono text-xs tracking-wide text-emerald-300'>APLICADO</Text>
          </View>
        )}
      </View>
      {showAppliedSummary ? (
        <AppliedAdjustmentSummary projection={projection} />
      ) : adjustment ? (
        hasProposalDeltas ? (
          <>
            <AdjustmentContext
              projection={projection}
              registeredMeals={registeredMeals}
              afterDay={addMacro(projection.consumed, projection.remaining)}
            />
            <View className='-mx-2 bg-zinc-900 border border-zinc-700 rounded-2xl p-4 mt-5'>
              <Text className='font-geist-mono text-sm tracking-widest text-white'>
                AJUSTES PROPUESTOS
              </Text>
              {changedMeals.map(({ meal, cells }) => (
                <View key={meal.id} className='border-t border-zinc-700 pt-3 mt-3'>
                  <Text className='font-geist-mono text-base text-white'>{meal.name}</Text>
                  <MacroTransition
                    before={macroTotal(cells, 'planned')}
                    after={macroTotal(cells, 'after')}
                  />
                </View>
              ))}
            </View>
            <View className='-mx-2 bg-zinc-900 border border-zinc-700 rounded-2xl p-4 mt-4'>
              <Text className='font-geist-mono text-sm tracking-widest text-white'>
                EQUIVALENTES RESTANTES
              </Text>
              <MacroTransition
                before={macroTotal(adjustableCells, 'before')}
                after={macroTotal(adjustableCells, 'remaining')}
              />
            </View>
            <View className='flex-row gap-2 mt-4'>
              <TouchableOpacity
                onPress={discardAdjustment}
                className='flex-1 border border-zinc-600 rounded-full py-3'
              >
                <Text className='font-geist-mono text-sm text-center text-white'>Descartar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={applyAdjustment}
                className='flex-1 bg-white rounded-full py-3'
              >
                <Text className='font-geist-mono text-sm text-center text-zinc-950'>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <AdjustmentContext projection={projection} registeredMeals={registeredMeals} />
            <Text className='font-geist-mono text-base text-zinc-300 mt-2'>
              No hay equivalentes pendientes que puedan compensar este desfase.
            </Text>
            <TouchableOpacity
              onPress={discardAdjustment}
              className='border border-zinc-600 rounded-full py-3 mt-4'
            >
              <Text className='font-geist-mono text-sm text-center text-white'>Cerrar</Text>
            </TouchableOpacity>
          </>
        )
      ) : hasImbalance ? (
        <>
          <AdjustmentContext projection={projection} registeredMeals={registeredMeals} />
          <Text className='font-geist-mono text-base text-zinc-300 mt-2'>
            Elige en qué comidas quieres compensar el desfase.
          </Text>
          {compensableMeals.length > 0 ? (
            <View className='flex-row flex-wrap gap-2 mt-4'>
              {compensableMeals.map(({ meal }) => {
                const selected = selectedMealIds.includes(meal.id)
                return (
                  <TouchableOpacity
                    key={meal.id}
                    onPress={() => toggleCompensableMeal(meal.id)}
                    className={`rounded-full border px-3 py-2 ${
                      selected ? 'bg-white border-white' : 'border-zinc-700'
                    }`}
                  >
                    <Text
                      className={`font-geist-mono text-xs ${
                        selected ? 'text-zinc-950' : 'text-zinc-300'
                      }`}
                    >
                      {meal.name}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          ) : (
            <Text className='font-geist-mono text-base text-zinc-400 mt-4'>
              No hay comidas sin registros disponibles para compensar.
            </Text>
          )}
          <TouchableOpacity
            onPress={() => proposeAdjustment(selectedMealIds)}
            disabled={!canCreateProposal}
            className={`rounded-full py-3 mt-4 ${canCreateProposal ? 'bg-white' : 'bg-zinc-800'}`}
          >
            <Text
              className={`font-geist-mono text-sm text-center ${
                canCreateProposal ? 'text-zinc-950' : 'text-zinc-500'
              }`}
            >
              Crear propuesta
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text className='font-geist-mono text-base text-zinc-400 mt-2'>
          El plan restante coincide con lo registrado hasta ahora.
        </Text>
      )}
    </View>
  )
}

function AppliedAdjustmentSummary({
  projection,
}: {
  projection: ReturnType<typeof projectDailyPlan>
}) {
  return (
    <View className='-mx-2 bg-zinc-900 border border-zinc-700 rounded-2xl p-4 mt-4'>
      <Text className='font-geist-mono text-sm tracking-widest text-white'>
        PLAN DEL DÍA REAJUSTADO
      </Text>
      <MacroTransition
        before={projection.base}
        after={addMacro(projection.consumed, projection.remaining)}
      />
    </View>
  )
}

function macroTotal(cells: DailyPlanCell[], value: 'planned' | 'before' | 'remaining' | 'after'): Macro {
  return cells.reduce<Macro>(
    (total, cell) => {
      const macro = GROUP_MACROS[cell.groupId]
      return {
        kcal: total.kcal + macro.kcal * cell[value],
        protein: total.protein + macro.protein * cell[value],
        carbs: total.carbs + macro.carbs * cell[value],
        fat: total.fat + macro.fat * cell[value],
      }
    },
    {
      kcal: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    },
  )
}

function addMacro(left: Macro, right: Macro): Macro {
  return {
    kcal: left.kcal + right.kcal,
    protein: left.protein + right.protein,
    carbs: left.carbs + right.carbs,
    fat: left.fat + right.fat,
  }
}

function AdjustmentContext({
  projection,
  registeredMeals,
  afterDay,
}: {
  projection: ReturnType<typeof projectDailyPlan>
  registeredMeals: Array<{
    meal: Meal
    planned: Macro
    consumed: Macro
    imbalance: Macro
  }>
  afterDay?: Macro
}) {
  const remaining = positiveMacro(projection.target)
  const exceeded = positiveMacro({
    kcal: -projection.target.kcal,
    protein: -projection.target.protein,
    carbs: -projection.target.carbs,
    fat: -projection.target.fat,
  })
  return (
    <>
      <View className='-mx-2 bg-zinc-900 border border-zinc-700 rounded-2xl p-4 mt-4'>
        <Text className='font-geist-mono text-sm tracking-widest text-white'>PLAN DEL DÍA</Text>
        {afterDay ? (
          <MacroTransition before={projection.base} after={afterDay} />
        ) : (
          <MacroLine values={projection.base} light />
        )}
      </View>
      {registeredMeals.length > 0 && (
        <View className='-mx-2 bg-zinc-900 border border-zinc-700 rounded-2xl p-4 mt-4'>
          <Text className='font-geist-mono text-sm tracking-widest text-white'>
            COMIDAS REGISTRADAS
          </Text>
          {registeredMeals.map(({ meal, planned, consumed, imbalance }) => (
            <View key={meal.id} className='border-t border-zinc-700 pt-3 mt-3'>
              <Text className='font-geist-mono text-base text-white'>{meal.name}</Text>
              <MacroTransition before={planned} after={consumed} />
              {hasMacroValue(imbalance) && (
                <>
                  <Text className='font-geist-mono text-xs tracking-widest text-amber-300 mt-3'>
                    POR COMPENSAR
                  </Text>
                  <MacroLine values={imbalance} light />
                </>
              )}
            </View>
          ))}
        </View>
      )}
      <View className='-mx-2 bg-zinc-900 border border-zinc-700 rounded-2xl p-4 mt-4'>
        <Text className='font-geist-mono text-sm tracking-widest text-white'>BALANCE DEL DÍA</Text>
        <Text className='font-geist-mono text-xs tracking-widest text-zinc-500 mt-4'>
          CONSUMIDO
        </Text>
        <MacroLine values={projection.consumed} light />
        <Text className='font-geist-mono text-xs tracking-widest text-zinc-500 mt-4'>
          OBJETIVO RESTANTE
        </Text>
        <MacroLine values={remaining} light />
        {hasMacroValue(exceeded) && (
          <>
            <Text className='font-geist-mono text-xs tracking-widest text-amber-300 mt-3'>
              EXCEDIDO
            </Text>
            <MacroLine values={exceeded} light />
          </>
        )}
      </View>
    </>
  )
}

function subtractMacro(left: Macro, right: Macro): Macro {
  return {
    kcal: left.kcal - right.kcal,
    protein: left.protein - right.protein,
    carbs: left.carbs - right.carbs,
    fat: left.fat - right.fat,
  }
}

function positiveMacro(values: Macro): Macro {
  return {
    kcal: Math.max(0, values.kcal),
    protein: Math.max(0, values.protein),
    carbs: Math.max(0, values.carbs),
    fat: Math.max(0, values.fat),
  }
}

function absoluteMacro(values: Macro): Macro {
  return {
    kcal: Math.abs(values.kcal),
    protein: Math.abs(values.protein),
    carbs: Math.abs(values.carbs),
    fat: Math.abs(values.fat),
  }
}

function hasMacroValue(values: Macro) {
  return Object.values(values).some((value) => value > 0.1)
}

function MacroTransition({ before, after }: { before: Macro; after: Macro }) {
  return (
    <View className='mt-3'>
      <Text className='font-geist-mono text-xs text-zinc-400'>
        {number(before.kcal)} kcal → {number(after.kcal)} kcal
      </Text>
      <Text className='font-geist-mono text-xs text-zinc-400 mt-1'>
        P {number(before.protein)}g → {number(after.protein)}g | C {number(before.carbs)}g →{' '}
        {number(after.carbs)}g | G {number(before.fat)}g → {number(after.fat)}g
      </Text>
    </View>
  )
}

type PlanEditorProps = {
  meals: Meal[]
  setExchange: (mealId: string, groupId: SmaeGroupId, value: number) => void
  close: () => void
  openManager: () => void
}

function PlanEditor({ meals, setExchange, close, openManager }: PlanEditorProps) {
  const [activeMealId, setActiveMealId] = useState(meals[0]?.id ?? '')
  const activeMeal = meals.find((meal) => meal.id === activeMealId) ?? meals[0]

  useEffect(() => {
    if (!meals.some((meal) => meal.id === activeMealId)) setActiveMealId(meals[0]?.id ?? '')
  }, [
    activeMealId,
    meals,
  ])

  if (!activeMeal) return null

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName='pb-6'>
      <View className='px-6 pt-4'>
        <View className='flex-row justify-between items-start'>
          <View>
            <Text className='font-geist-mono text-sm tracking-widest text-zinc-500'>
              CONFIGURACIÓN
            </Text>
            <Text className='font-geist-mono text-3xl text-zinc-950 mt-1'>Equivalentes</Text>
          </View>
          <TouchableOpacity
            onPress={close}
            className='border border-zinc-300 rounded-full px-3 py-2'
          >
            <Text className='font-geist-mono text-sm text-zinc-800'>Listo</Text>
          </TouchableOpacity>
        </View>
        <View className='flex-row justify-between items-center mt-4'>
          <Text className='font-geist-mono text-base text-zinc-500'>
            Asigna equivalentes por comida.
          </Text>
          <TouchableOpacity onPress={openManager} className='p-2'>
            <Feather name='edit-3' size={16} color='#52525b' />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName='px-5 gap-2 py-4'
      >
        {meals.map((meal) => (
          <TouchableOpacity
            key={meal.id}
            onPress={() => setActiveMealId(meal.id)}
            className={`rounded-full px-4 py-2.5 ${meal.id === activeMeal.id ? 'bg-zinc-950' : 'bg-white border border-zinc-200'}`}
          >
            <Text
              className={`font-geist-mono text-sm ${meal.id === activeMeal.id ? 'text-white' : 'text-zinc-600'}`}
            >
              {meal.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View className='mx-5 bg-white rounded-3xl px-5 pt-6 pb-1 border border-zinc-100'>
        <View className='flex-row justify-between items-baseline mb-3'>
          <Text className='font-geist-mono-medium tracking-widest text-lg text-zinc-950'>
            {activeMeal.name.toUpperCase()}
          </Text>
          <Text className='font-geist-mono text-sm text-zinc-400'>equivalentes</Text>
        </View>
        {MEAL_EXCHANGE_GROUPS.map((groupId) => (
          <View
            key={groupId}
            className='flex-row items-center justify-between py-2 border-t border-zinc-100'
          >
            <Text className='font-geist-mono text-base text-zinc-800 flex-1 pr-2'>
              {getGroupLabel(groupId)}
            </Text>
            <View className='flex-row items-center gap-1'>
              <TouchableOpacity
                accessibilityLabel={`Restar ${getGroupLabel(groupId)}`}
                onPress={() =>
                  setExchange(activeMeal.id, groupId, (activeMeal.exchanges[groupId] ?? 0) - 0.5)
                }
                className='bg-zinc-100 w-10 h-10 rounded-full items-center justify-center'
              >
                <Feather name='minus' size={14} />
              </TouchableOpacity>
              <Text className='font-geist-mono text-center text-base w-14 px-3 py-3 rounded-full text-zinc-950'>
                {activeMeal.exchanges[groupId] ?? 0}
              </Text>
              <TouchableOpacity
                accessibilityLabel={`Sumar ${getGroupLabel(groupId)}`}
                onPress={() =>
                  setExchange(activeMeal.id, groupId, (activeMeal.exchanges[groupId] ?? 0) + 0.5)
                }
                className='bg-zinc-950 w-10 h-10 rounded-full items-center justify-center'
              >
                <Feather name='plus' color='white' size={14} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

function MacroLine({ values, light = false }: { values: Macro; light?: boolean }) {
  const style = light ? 'text-zinc-300' : 'text-zinc-600'
  return (
    <View className='flex-row flex-wrap items-center mt-2'>
      <Text className={`font-geist-mono text-sm ${style}`}>{number(values.kcal)} kcal</Text>
      <Text className={`font-geist-mono text-sm mx-2 ${style}`}>|</Text>
      <Text className={`font-geist-mono text-sm ${style}`}>P {number(values.protein)}g</Text>
      <Text className={`font-geist-mono text-sm mx-2 ${style}`}>|</Text>
      <Text className={`font-geist-mono text-sm ${style}`}>C {number(values.carbs)}g</Text>
      <Text className={`font-geist-mono text-sm mx-2 ${style}`}>|</Text>
      <Text className={`font-geist-mono text-sm ${style}`}>G {number(values.fat)}g</Text>
    </View>
  )
}

type MealManagerProps = {
  visible: boolean
  close: () => void
  meals: Meal[]
  newName: string
  setNewName: (name: string) => void
  addMeal: (name: string) => void
  renameMeal: (mealId: string, name: string) => void
  removeMeal: (mealId: string) => void
}

function MealManager({
  visible,
  close,
  meals,
  newName,
  setNewName,
  addMeal,
  renameMeal,
  removeMeal,
}: MealManagerProps) {
  const create = () => {
    const name = newName.trim()
    if (!name) return
    addMeal(name)
    setNewName('')
  }
  const askRemove = (meal: Meal) =>
    Alert.alert('Eliminar comida', `También se eliminarán sus registros de alimentos.`, [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => removeMeal(meal.id),
      },
    ])
  return (
    <AppBottomSheet visible={visible} onDismiss={close}>
      <View className='flex-row justify-between items-center mb-4'>
        <Text className='font-geist-mono-medium text-lg text-zinc-950'>Editar comidas</Text>
        <TouchableOpacity onPress={close} className='p-1'>
          <Feather name='x' size={22} />
        </TouchableOpacity>
      </View>
      {meals.map((meal) => (
        <View key={meal.id} className='flex-row items-center gap-2 py-2 border-t border-zinc-200'>
          <TextInput
            value={meal.name}
            onChangeText={(name) => renameMeal(meal.id, name)}
            className='flex-1 bg-white border border-zinc-200 rounded-full px-4 py-3 font-geist-mono-light text-sm text-zinc-950'
          />
          <TouchableOpacity
            onPress={() => askRemove(meal)}
            disabled={meals.length <= 1}
            className='w-10 h-10 items-center justify-center'
          >
            <Feather name='trash-2' size={17} color={meals.length <= 1 ? '#d4d4d8' : '#b91c1c'} />
          </TouchableOpacity>
        </View>
      ))}
      <View className='flex-row gap-2 mt-5'>
        <TextInput
          value={newName}
          onChangeText={setNewName}
          placeholder='Nueva comida'
          placeholderTextColor='#71717a'
          className='flex-1 bg-white border border-zinc-200 rounded-full px-4 py-3 font-geist-mono text-sm text-zinc-950'
        />
        <TouchableOpacity onPress={create} className='bg-zinc-950 rounded-full px-4 justify-center'>
          <Feather name='plus' color='white' />
        </TouchableOpacity>
      </View>
      <Text className='font-geist-mono text-xs text-zinc-500 mt-4'>
        Puedes añadir, renombrar o eliminar comidas. Debe permanecer al menos una.
      </Text>
      <View className='h-4' />
    </AppBottomSheet>
  )
}
