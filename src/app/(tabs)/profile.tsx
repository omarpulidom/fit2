import { Feather } from '@expo/vector-icons'
import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetFlatList,
  type BottomSheetFlatListMethods,
  BottomSheetModal,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet'
import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppBottomSheet } from '@/components/Elements/AppBottomSheet'
import {
  CATALOG_BY_GROUP,
  CATALOG_SEARCH_INDEX,
  GROUP_MACROS,
  GROUPS,
  normalizeCatalogSearch,
} from '@/features/smae/data'
import { useSmaeStore } from '@/features/smae/store'
import type { ExternalFood, Food, Macro, Meal, SmaeGroup } from '@/features/smae/types'

const empty: Macro = {
  kcal: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
}
const add = (a: Macro, b: Macro): Macro => ({
  kcal: a.kcal + b.kcal,
  protein: a.protein + b.protein,
  carbs: a.carbs + b.carbs,
  fat: a.fat + b.fat,
})
const macroFor = (meal: Meal) =>
  Object.entries(meal.exchanges).reduce((total, [group, quantity]) => {
    const macro = GROUP_MACROS[group as keyof typeof GROUP_MACROS]
    if (!macro) return total
    const q = quantity ?? 0
    return add(total, {
      kcal: macro.kcal * q,
      protein: macro.protein * q,
      carbs: macro.carbs * q,
      fat: macro.fat * q,
    })
  }, empty)
const number = (value: number) => `${Number(value.toFixed(1))}`
const MEAL_EXCHANGE_GROUPS = GROUPS.filter(
  (group) => group !== 'Cereales · con grasa' && group !== 'AOA · alto aporte de grasa',
)

export default function PlanTab() {
  const { meals, setExchange, addMeal, renameMeal, removeMeal } = useSmaeStore()
  const [activeMealId, setActiveMealId] = useState(meals[0]?.id ?? '')
  const [managerOpen, setManagerOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const activeMeal = meals.find((meal) => meal.id === activeMealId) ?? meals[0]
  const dayTotal = useMemo(
    () => meals.reduce((total, meal) => add(total, macroFor(meal)), empty),
    [
      meals,
    ],
  )

  useEffect(() => {
    if (!meals.some((meal) => meal.id === activeMealId)) setActiveMealId(meals[0]?.id ?? '')
  }, [
    activeMealId,
    meals,
  ])

  if (!activeMeal) return null

  return (
    <SafeAreaView
      className='flex-1 bg-[#f7f7f5]'
      edges={[
        'top',
        'left',
        'right',
      ]}
    >
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
              onPress={() => setManagerOpen(true)}
              className='border border-zinc-300 rounded-full px-3 py-2 flex-row gap-2'
            >
              <Feather name='edit-3' size={14} color='#3f3f46' />
              <Text className='font-geist-mono text-sm text-zinc-800'>Editar comidas</Text>
            </TouchableOpacity>
          </View>
          <Text className='font-geist-mono text-base text-zinc-500 mt-4 mb-5'>
            Selecciona una comida y asigna sus equivalentes.{'\n'}El resumen se actualiza al
            instante.
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName='px-5 gap-2 pb-4'
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
          {MEAL_EXCHANGE_GROUPS.map((group) => (
            <View
              key={group}
              className='flex-row items-center justify-between py-2 border-t border-zinc-100'
            >
              <Text className='font-geist-mono text-base text-zinc-800 flex-1 pr-2'>{group}</Text>
              <View className='flex-row items-center gap-1'>
                <TouchableOpacity
                  accessibilityLabel={`Restar ${group}`}
                  onPress={() =>
                    setExchange(activeMeal.id, group, (activeMeal.exchanges[group] ?? 0) - 0.5)
                  }
                  className='bg-zinc-100 w-10 h-10 rounded-full items-center justify-center'
                >
                  <Feather name='minus' size={14} />
                </TouchableOpacity>
                <Text className='font-geist-mono text-center text-base w-14 px-3 py-3 rounded-full text-zinc-950'>
                  {activeMeal.exchanges[group] ?? 0}
                </Text>
                <TouchableOpacity
                  accessibilityLabel={`Sumar ${group}`}
                  onPress={() =>
                    setExchange(activeMeal.id, group, (activeMeal.exchanges[group] ?? 0) + 0.5)
                  }
                  className='bg-zinc-950 w-10 h-10 rounded-full items-center justify-center'
                >
                  <Feather name='plus' color='white' size={14} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View className='mx-5 mt-4 bg-zinc-950 rounded-3xl p-5'>
          <Text className='font-geist-mono text-lg tracking-widest text-zinc-400'>
            RESUMEN TOTAL
          </Text>
          <View className='mt-4'>
            {meals.map((meal) => (
              <View key={meal.id} className='pb-4 mb-4 border-b border-zinc-700'>
                <Text className='font-geist-mono text-base text-white'>{meal.name}</Text>
                <MacroLine values={macroFor(meal)} light />
              </View>
            ))}
          </View>
          <View>
            <Text className='font-geist-mono text-base text-white'>Total del día</Text>
            <MacroLine values={dayTotal} light />
          </View>
        </View>
      </ScrollView>
      <MealManager
        visible={managerOpen}
        close={() => setManagerOpen(false)}
        meals={meals}
        activeMealId={activeMeal.id}
        setActiveMealId={setActiveMealId}
        newName={newName}
        setNewName={setNewName}
        addMeal={addMeal}
        renameMeal={renameMeal}
        removeMeal={removeMeal}
      />
    </SafeAreaView>
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
  activeMealId: string
  setActiveMealId: (mealId: string) => void
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
  activeMealId,
  setActiveMealId,
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
        onPress: () => {
          removeMeal(meal.id)
          if (meal.id === activeMealId)
            setActiveMealId(meals.find((item: Meal) => item.id !== meal.id)?.id ?? '')
        },
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
      {meals.map((meal: Meal) => (
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

type CatalogModalProps = {
  visible: boolean
  close: () => void
  meals: Meal[]
  addExternal: (food: Omit<ExternalFood, 'id' | 'createdAt'>) => void
}

function _CatalogModal({ visible, close, meals, addExternal }: CatalogModalProps) {
  const sheetRef = useRef<BottomSheetModal>(null)
  const listRef = useRef<BottomSheetFlatListMethods>(null)
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [selectedGroup, setSelectedGroup] = useState<SmaeGroup | null>(null)
  const normalizedQuery = normalizeCatalogSearch(deferredQuery.trim())
  const isBrowsingGroups = !normalizedQuery && !selectedGroup
  const filteredCatalog = useMemo(() => {
    if (!normalizedQuery) return selectedGroup ? CATALOG_BY_GROUP[selectedGroup] : []

    return CATALOG_SEARCH_INDEX.filter(
      ({ food, searchText }) =>
        (!selectedGroup || food.group === selectedGroup) && searchText.includes(normalizedQuery),
    ).map(({ food }) => food)
  }, [
    normalizedQuery,
    selectedGroup,
  ])
  const choose = useCallback(
    (food: Food) =>
      Alert.alert(food.name, '¿En qué comida registras 1 equivalente?', [
        ...meals.map((meal) => ({
          text: meal.name,
          onPress: () =>
            addExternal({
              name: food.name,
              mode: 'macros',
              mealId: meal.id,
              referencePortion: 1,
              eatenPortion: 1,
              macro: food.perExchange,
            }),
        })),
        {
          text: 'Cancelar',
          style: 'cancel' as const,
        },
      ]),
    [
      addExternal,
      meals,
    ],
  )
  const renderFood = useCallback(
    ({ item }: { item: Food }) => <CatalogFoodRow food={item} onChoose={choose} />,
    [
      choose,
    ],
  )
  const resetToTop = useCallback(() => {
    requestAnimationFrame(() =>
      listRef.current?.scrollToOffset({
        offset: 0,
        animated: false,
      }),
    )
  }, [])
  const closeCatalog = useCallback(() => {
    setQuery('')
    setSelectedGroup(null)
    close()
  }, [
    close,
  ])
  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
    ),
    [],
  )

  useEffect(() => {
    if (!visible) return
    const frame = requestAnimationFrame(() => sheetRef.current?.present())
    return () => cancelAnimationFrame(frame)
  }, [
    visible,
  ])

  if (!visible) return null

  return (
    <BottomSheetModal
      ref={sheetRef}
      index={0}
      snapPoints={[
        '85%',
      ]}
      enableDynamicSizing={false}
      enablePanDownToClose
      keyboardBehavior='interactive'
      keyboardBlurBehavior='restore'
      backdropComponent={renderBackdrop}
      onDismiss={closeCatalog}
      backgroundStyle={{
        backgroundColor: '#f7f7f5',
      }}
      handleIndicatorStyle={{
        backgroundColor: '#a1a1aa',
      }}
    >
      <BottomSheetFlatList
        ref={listRef}
        data={filteredCatalog}
        keyExtractor={(food: Food) => food.id}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        updateCellsBatchingPeriod={50}
        windowSize={7}
        removeClippedSubviews
        keyboardShouldPersistTaps='handled'
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 24,
        }}
        ListHeaderComponent={
          <View>
            <View className='flex-row justify-between items-center mb-4'>
              <View>
                <Text className='font-geist-mono text-xl text-zinc-950'>Catálogo SMAE</Text>
                <Text className='font-geist-mono text-sm text-zinc-500 mt-1'>
                  {isBrowsingGroups
                    ? 'Elige un grupo o busca un alimento'
                    : `${filteredCatalog.length} alimentos`}
                </Text>
              </View>
              <TouchableOpacity onPress={closeCatalog} className='p-1'>
                <Feather name='x' size={22} />
              </TouchableOpacity>
            </View>
            <BottomSheetTextInput
              value={query}
              onChangeText={(value) => {
                setQuery(value)
                resetToTop()
              }}
              placeholder='Buscar alimento'
              placeholderTextColor='#a1a1aa'
              className='border border-zinc-200 bg-white rounded-full px-4 py-3 font-geist-mono text-zinc-950'
            />
            {!isBrowsingGroups && (
              <TouchableOpacity
                onPress={() => {
                  setSelectedGroup(null)
                  setQuery('')
                  resetToTop()
                }}
                className='self-start rounded-full px-3 py-2 bg-white border border-zinc-200 mt-3 mb-1'
              >
                <Text className='font-geist-mono text-xs text-zinc-600'>← Grupos</Text>
              </TouchableOpacity>
            )}
            {isBrowsingGroups && (
              <View className='flex-row flex-wrap gap-2 py-4'>
                {GROUPS.map((group) => (
                  <CatalogGroup
                    key={group}
                    group={group}
                    count={CATALOG_BY_GROUP[group].length}
                    onPress={() => {
                      setSelectedGroup(group)
                      resetToTop()
                    }}
                  />
                ))}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          isBrowsingGroups ? null : (
            <Text className='font-geist-mono text-base text-zinc-500 py-6'>
              No encontramos alimentos con esa búsqueda.
            </Text>
          )
        }
        renderItem={renderFood}
      />
    </BottomSheetModal>
  )
}

function CatalogGroup({
  group,
  count,
  onPress,
}: {
  group: SmaeGroup
  count: number
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className='w-[48%] bg-white border border-zinc-200 rounded-2xl p-3'
    >
      <Text className='font-geist-mono text-sm text-zinc-900'>{group}</Text>
      <Text className='font-geist-mono text-xs text-zinc-500 mt-1'>{count} alimentos</Text>
    </TouchableOpacity>
  )
}

const CatalogFoodRow = memo(function CatalogFoodRow({
  food,
  onChoose,
}: {
  food: Food
  onChoose: (food: Food) => void
}) {
  return (
    <TouchableOpacity
      onPress={() => onChoose(food)}
      className='py-3 border-t border-zinc-200 flex-row justify-between items-center'
    >
      <View className='flex-1 pr-3'>
        <Text className='font-geist-mono text-base text-zinc-900'>{food.name}</Text>
        <Text className='font-geist-mono text-sm text-zinc-500 mt-1'>
          {food.group} · {food.portion}
        </Text>
      </View>
      <Feather name='plus' size={17} color='#52525b' />
    </TouchableOpacity>
  )
})
