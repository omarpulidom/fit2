import { Feather } from '@expo/vector-icons'
import { useEffect, useMemo, useState } from 'react'
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppBottomSheet } from '@/components/Elements/AppBottomSheet'
import { type DailyPlanCell, projectDailyPlan } from '@/features/smae/daily-plan'
import { GROUPS, getGroupLabel } from '@/features/smae/data'
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

  const askResetDay = () =>
    Alert.alert(
      'Reiniciar día',
      'Se borrarán tus registros y se restablecerán las comidas y equivalentes del día.',
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
          resetDay={askResetDay}
        />
      ) : (
        <DailyPlanView
          projection={projection}
          hasImbalance={hasImbalance}
          adjustment={activeAdjustment}
          openEditor={() => setEditing(true)}
          proposeAdjustment={proposeAdjustment}
          applyAdjustment={applyAdjustment}
          discardAdjustment={discardAdjustment}
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
  openEditor: () => void
  proposeAdjustment: () => void
  applyAdjustment: () => void
  discardAdjustment: () => void
}

function DailyPlanView({
  projection,
  hasImbalance,
  adjustment,
  openEditor,
  proposeAdjustment,
  applyAdjustment,
  discardAdjustment,
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

      <AdjustmentPanel
        adjustment={adjustment}
        hasImbalance={hasImbalance}
        residual={projection.residual}
        proposeAdjustment={proposeAdjustment}
        applyAdjustment={applyAdjustment}
        discardAdjustment={discardAdjustment}
      />
    </ScrollView>
  )
}

function PlanMatrix({ projection }: { projection: ReturnType<typeof projectDailyPlan> }) {
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
  const changed = Math.abs(cell.pending) > 0.001 || Math.abs(cell.applied) > 0.001
  const unplannedConsumption = cell.planned === 0 && cell.consumed > 0
  return (
    <View className='w-28 px-3 py-3 border-r border-zinc-100 min-h-14 justify-center'>
      <Text className={`font-geist-mono text-sm ${changed ? 'text-zinc-950' : 'text-zinc-600'}`}>
        {changed ? `${number(cell.before)} → ${number(cell.remaining)}` : number(cell.remaining)}
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
      <MacroLine values={meal.macro} />
    </View>
  )
}

function MealPlanRow({ cell }: { cell: DailyPlanCell }) {
  const changed = Math.abs(cell.pending) > 0.001 || Math.abs(cell.applied) > 0.001
  return (
    <View className='flex-row justify-between items-center py-2 border-t border-zinc-100'>
      <View className='flex-1 pr-3'>
        <Text className='font-geist-mono text-sm text-zinc-800'>{getGroupLabel(cell.groupId)}</Text>
        <Text className='font-geist-mono text-xs text-zinc-400 mt-1'>
          Plan {number(cell.planned)} · Consumido {number(cell.consumed)}
        </Text>
      </View>
      <Text className='font-geist-mono text-sm text-zinc-950'>
        {changed ? `${number(cell.before)} → ${number(cell.remaining)}` : number(cell.remaining)} eq
      </Text>
    </View>
  )
}

type AdjustmentPanelProps = {
  adjustment: ReturnType<typeof useSmaeStore.getState>['adjustment']
  hasImbalance: boolean
  residual: Macro
  proposeAdjustment: () => void
  applyAdjustment: () => void
  discardAdjustment: () => void
}

function AdjustmentPanel({
  adjustment,
  hasImbalance,
  residual,
  proposeAdjustment,
  applyAdjustment,
  discardAdjustment,
}: AdjustmentPanelProps) {
  return (
    <View className='mx-5 mt-5 bg-zinc-950 rounded-3xl p-5'>
      <Text className='font-geist-mono text-lg tracking-widest text-white'>REAJUSTE</Text>
      {adjustment ? (
        adjustment.deltas.length ? (
          <>
            <Text className='font-geist-mono text-base text-zinc-300 mt-2'>
              Propuesta para {adjustment.deltas.length} saldo
              {adjustment.deltas.length === 1 ? '' : 's'} de equivalentes.
            </Text>
            <Text className='font-geist-mono text-sm text-zinc-400 mt-2'>
              Diferencia restante: P {number(residual.protein)}g | C {number(residual.carbs)}g | G{' '}
              {number(residual.fat)}g | {number(residual.kcal)} kcal
            </Text>
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
            <Text className='font-geist-mono text-base text-zinc-300 mt-2'>
              No hay equivalentes pendientes que puedan compensar este desfase.
            </Text>
            <Text className='font-geist-mono text-sm text-zinc-400 mt-2'>
              Diferencia restante: P {number(residual.protein)}g | C {number(residual.carbs)}g | G{' '}
              {number(residual.fat)}g | {number(residual.kcal)} kcal
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
          <Text className='font-geist-mono text-base text-zinc-300 mt-2'>
            Hay un desfase entre lo consumido y tu plan base.
          </Text>
          <TouchableOpacity onPress={proposeAdjustment} className='bg-white rounded-full py-3 mt-4'>
            <Text className='font-geist-mono text-sm text-center text-zinc-950'>
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

type PlanEditorProps = {
  meals: Meal[]
  setExchange: (mealId: string, groupId: SmaeGroupId, value: number) => void
  close: () => void
  openManager: () => void
  resetDay: () => void
}

function PlanEditor({ meals, setExchange, close, openManager, resetDay }: PlanEditorProps) {
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
      <TouchableOpacity
        onPress={resetDay}
        className='mx-5 mt-4 border border-zinc-300 rounded-full px-4 py-3 flex-row items-center justify-center gap-2'
      >
        <Feather name='rotate-ccw' size={15} color='#52525b' />
        <Text className='font-geist-mono text-sm text-zinc-600'>Reiniciar día</Text>
      </TouchableOpacity>
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
