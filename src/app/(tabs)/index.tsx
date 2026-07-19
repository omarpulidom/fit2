import { Feather } from '@expo/vector-icons'
import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetFlatList,
  type BottomSheetFlatListMethods,
  BottomSheetModal,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, ScrollView, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Circle } from 'react-native-svg'
import {
  CATALOG_BY_GROUP,
  CATALOG_SEARCH_INDEX,
  GROUP_MACROS,
  GROUPS,
  normalizeCatalogSearch,
} from '@/features/smae/data'
import { useSmaeStore } from '@/features/smae/store'
import type { Food, Macro, SmaeGroup } from '@/features/smae/types'

const sum = (items: Macro[]) =>
  items.reduce(
    (a, x) => ({
      kcal: a.kcal + x.kcal,
      protein: a.protein + x.protein,
      carbs: a.carbs + x.carbs,
      fat: a.fat + x.fat,
    }),
    {
      kcal: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    },
  )
const n = (v: number) => `${Math.round(v)}`

export default function HomeTab() {
  const { meals, externalFoods, adjustment, addExternal, proposeAdjustment, applyAdjustment } =
    useSmaeStore()
  const [modal, setModal] = useState(false)
  const [source, setSource] = useState<'smae' | 'external'>('smae')
  const [mode, setMode] = useState<'macros' | 'calories'>('macros')
  const [form, setForm] = useState({
    name: '',
    kcal: '',
    protein: '',
    carbs: '',
    fat: '',
    ref: '',
    eaten: '',
    mealId: meals[0]?.id ?? '',
  })
  const plan = useMemo(
    () =>
      sum(
        meals.flatMap((m) =>
          Object.entries(m.exchanges).map(([g, x]) => {
            const macro = GROUP_MACROS[g as keyof typeof GROUP_MACROS]
            const q = x ?? 0
            return macro
              ? {
                  kcal: macro.kcal * q,
                  protein: macro.protein * q,
                  carbs: macro.carbs * q,
                  fat: macro.fat * q,
                }
              : {
                  kcal: 0,
                  protein: 0,
                  carbs: 0,
                  fat: 0,
                }
          }),
        ),
      ),
    [
      meals,
    ],
  )
  const consumed = useMemo(
    () =>
      sum(
        externalFoods.map((f) => {
          const q = f.eatenPortion / f.referencePortion
          return {
            kcal: f.macro.kcal * q,
            protein: f.macro.protein * q,
            carbs: f.macro.carbs * q,
            fat: f.macro.fat * q,
          }
        }),
      ),
    [
      externalFoods,
    ],
  )
  const closeModal = () => {
    setModal(false)
    setSource('smae')
  }
  const saveExternal = () => {
    if (!form.name.trim() || !Number(form.kcal) || !Number(form.ref) || !Number(form.eaten))
      return Alert.alert('Completa nombre, calorías y porciones.')
    addExternal({
      name: form.name.trim(),
      source: 'external',
      mode,
      mealId: form.mealId,
      referencePortion: Number(form.ref),
      eatenPortion: Number(form.eaten),
      macro: {
        kcal: Number(form.kcal),
        protein: mode === 'macros' ? Number(form.protein) : 0,
        carbs: mode === 'macros' ? Number(form.carbs) : 0,
        fat: mode === 'macros' ? Number(form.fat) : 0,
      },
    })
    closeModal()
    setForm({
      ...form,
      name: '',
      kcal: '',
      protein: '',
      carbs: '',
      fat: '',
    })
  }
  const saveSmae = (food: Food, equivalents: number, mealId: string) => {
    if (!mealId) return Alert.alert('Selecciona una comida.')
    addExternal({
      name: food.name,
      source: 'smae',
      smaeGroup: food.group,
      mode: 'macros',
      mealId,
      referencePortion: 1,
      eatenPortion: equivalents,
      macro: food.perExchange,
    })
    closeModal()
  }
  const progress = (label: string, units: string, used: number, target: number) => (
    <View className='mb-4'>
      <View className='flex-row justify-between'>
        <View className='flex-row items-center'>
          <Text className='text-zinc-600 font-geist-mono text-base'>{label}</Text>
          <Text className='text-zinc-950 font-geist-mono text-base'> · </Text>
          <Text className='text-zinc-600 font-geist-mono-light text-sm'>{units}</Text>
        </View>
        <Text className='text-zinc-900 font-geist-mono text-base'>
          {n(used)} / {n(target)}
        </Text>
      </View>
      <View className='mt-2 h-2 bg-zinc-100 rounded'>
        <View
          className='h-2 bg-zinc-900 rounded'
          style={{
            width: `${Math.min(100, target ? (used / target) * 100 : 0)}%`,
          }}
        />
      </View>
    </View>
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
      <ScrollView contentContainerClassName='px-6 pt-4 pb-4' showsVerticalScrollIndicator={false}>
        <View className='flex-row justify-between items-start mb-4'>
          <View>
            <Text className='font-geist-mono text-sm tracking-widest text-zinc-500'>
              SMAE / HOY
            </Text>
            <Text className='font-geist-mono text-3xl text-zinc-950 mt-1'>Tu día</Text>
          </View>
          <TouchableOpacity
            onPress={() => setModal(true)}
            className='bg-zinc-950 rounded-full px-4 py-3 flex-row gap-2'
          >
            <Feather name='plus' color='white' size={16} />
            <Text className='text-white font-geist-mono text-sm'>Registrar</Text>
          </TouchableOpacity>
        </View>

        {false && (
          <View className='bg-white rounded-3xl p-5 border border-zinc-100 mb-4'>
            <Text className='font-geist-mono text-lg text-zinc-950 mb-5 tracking-widest'>
              PROGRESO DEL DÍA
            </Text>
            {progress('Proteína', 'g', consumed.protein, plan.protein)}
            {progress('Carbohidratos', 'g', consumed.carbs, plan.carbs)}
            {progress('Grasa', 'g', consumed.fat, plan.fat)}
            <View className='border-t border-zinc-100 pt-4 mt-1'>
              {progress('Energía', 'kcal', consumed.kcal, plan.kcal)}
            </View>
            <Text className='font-geist-mono text-sm text-zinc-400 mt-2'>
              Meta basada en tus equivalentes configurados.
            </Text>
          </View>
        )}
        <View className='h-8' />
        <View className='flex-col'>
          <View className='flex-row items-end'>
            <Text className='font-doto-medium tracking-tighter text-8xl text-zinc-950'>
              {consumed.kcal}
            </Text>
            <Text className='font-geist-mono-extralight tracking-tighter text-4xl text-zinc-500 pb-5'>
              /{plan.kcal}
            </Text>
          </View>
          <Text className='font-geist-mono-light text-2xl text-zinc-400 -mt-4'>KCAL</Text>
        </View>
        <View className='flex-row gap-1 mt-4 mb-1'>
          <MacroProgressCard label='Proteína' used={consumed.protein} target={plan.protein} />
          <MacroProgressCard label='Carbohidratos' used={consumed.carbs} target={plan.carbs} />
        </View>
        <View className='flex-row gap-1 mb-4'>
          <MacroProgressCard label='Grasa' used={consumed.fat} target={plan.fat} />
          <View className='flex-1 min-w-0 p-4' />
        </View>
        <View className='bg-white rounded-3xl p-5 border border-zinc-100 mb-4'>
          <View className='flex-row justify-between items-center mb-2'>
            <Text className='font-geist-mono text-lg text-zinc-950 tracking-widest'>REGISTRO</Text>
            <Text className='font-geist-mono text-sm text-zinc-400'>
              {externalFoods.length} alimentos
            </Text>
          </View>
          {externalFoods.length === 0 ? (
            <Text className='font-geist-mono text-base text-zinc-500'>
              Aún no registras alimentos. Añade un alimento SMAE desde tu plan o uno externo aquí.
            </Text>
          ) : (
            externalFoods.map((f) => (
              <View key={f.id} className='py-3 border-t border-zinc-100 flex-row justify-between'>
                <View>
                  <Text className='font-geist-mono text-base text-zinc-900'>{f.name}</Text>
                  <Text className='font-geist-mono text-sm text-zinc-500'>
                    {meals.find((m) => m.id === f.mealId)?.name} ·{' '}
                    {f.source === 'smae'
                      ? f.smaeGroup
                      : f.mode === 'macros'
                        ? 'macros completos'
                        : 'solo kcal'}
                  </Text>
                </View>
                <Text className='font-geist-mono text-base'>
                  {n((f.macro.kcal * f.eatenPortion) / f.referencePortion)} kcal
                </Text>
              </View>
            ))
          )}
        </View>
        <View className='bg-zinc-950 rounded-3xl p-5'>
          <Text className='text-white font-geist-mono text-lg tracking-widest'>
            REAJUSTE DINÁMICO
          </Text>
          <Text className='text-zinc-400 font-geist-mono text-base mt-2'>
            Compensa kcal no asignadas con cereales sin grasa y grasas sin proteína. Tus grupos base
            no se modifican.
          </Text>
          {adjustment?.status === 'pending' ? (
            <View className='mt-4'>
              <Text className='text-white font-geist-mono text-base'>
                Propuesta: {n(-(adjustment.delta['Cereales · sin grasa'] ?? 0))} cereales y{' '}
                {n(-(adjustment.delta['Grasas · sin proteína'] ?? 0))} grasas
              </Text>
              {adjustment.remainingKcal > 0 && (
                <Text className='text-amber-300 font-geist-mono text-sm mt-2'>
                  Quedan {n(adjustment.remainingKcal)} kcal sin compensar.
                </Text>
              )}
              <TouchableOpacity
                onPress={applyAdjustment}
                className='bg-white rounded-full p-3 mt-4'
              >
                <Text className='text-zinc-950 font-geist-mono text-center text-base'>
                  Aplicar propuesta
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={proposeAdjustment}
              className='border border-zinc-600 rounded-full p-3 mt-4'
            >
              <Text className='text-white font-geist-mono text-center text-base'>
                Ver propuesta
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
      <FoodModal
        visible={modal}
        close={closeModal}
        source={source}
        setSource={setSource}
        mode={mode}
        setMode={setMode}
        form={form}
        setForm={setForm}
        meals={meals}
        saveExternal={saveExternal}
        saveSmae={saveSmae}
      />
    </SafeAreaView>
  )
}

function MacroProgressCard({
  label,
  used,
  target,
}: {
  label: string
  used: number
  target: number
}) {
  const size = 36
  const strokeWidth = 4
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(1, target ? used / target : 0)
  const dashOffset = circumference * (1 - progress)

  return (
    <View className='flex-1 min-w-0 bg-white border border-zinc-100 rounded-3xl p-4'>
      <Text
        className='font-geist-mono tracking-widest text-base text-zinc-950 text-left'
        numberOfLines={1}
      >
        {label.toLocaleUpperCase()}
      </Text>
      <View className='flex-row justify-between mt-1 items-center'>
        <View className='gap-1'>
          <View className='flex-row items-center'>
            <Text className='font-geist-mono text-lg text-zinc-950 mt-3 leading-none'>
              {n(used)}
            </Text>
            <Text className='font-geist-mono-light text-base text-zinc-600 mt-3 leading-none'>
              /{n(target)}
            </Text>
          </View>
          <Text className='font-geist-mono text-sm text-zinc-400 leading-none'>g</Text>
        </View>
        <View className='mt-3 items-center justify-center'>
          <Svg width={size} height={size}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke='#f4f4f5'
              strokeWidth={strokeWidth}
              fill='none'
            />
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke='#18181b'
              strokeWidth={strokeWidth}
              fill='none'
              strokeLinecap='round'
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </Svg>
        </View>
      </View>
    </View>
  )
}

type ExternalFoodForm = {
  name: string
  kcal: string
  protein: string
  carbs: string
  fat: string
  ref: string
  eaten: string
  mealId: string
}

type FoodModalProps = {
  visible: boolean
  close: () => void
  source: 'smae' | 'external'
  setSource: (source: 'smae' | 'external') => void
  mode: 'macros' | 'calories'
  setMode: (mode: 'macros' | 'calories') => void
  form: ExternalFoodForm
  setForm: (form: ExternalFoodForm) => void
  meals: {
    id: string
    name: string
  }[]
  saveExternal: () => void
  saveSmae: (food: Food, equivalents: number, mealId: string) => void
}

function FoodModal({
  visible,
  close,
  source,
  setSource,
  mode,
  setMode,
  form,
  setForm,
  meals,
  saveExternal,
  saveSmae,
}: FoodModalProps) {
  const sheetRef = useRef<BottomSheetModal>(null)
  const listRef = useRef<BottomSheetFlatListMethods>(null)
  const { height } = useWindowDimensions()
  const [query, setQuery] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<SmaeGroup | null>(null)
  const [selectedFood, setSelectedFood] = useState<Food | null>(null)
  const [equivalents, setEquivalents] = useState(1)
  const normalizedQuery = normalizeCatalogSearch(query.trim())
  const isBrowsingGroups = !normalizedQuery && !selectedGroup
  const resetToTop = useCallback(() => {
    requestAnimationFrame(() =>
      listRef.current?.scrollToOffset({
        offset: 0,
        animated: false,
      }),
    )
  }, [])
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
  useEffect(() => {
    if (visible) return
    setQuery('')
    setSelectedGroup(null)
    setSelectedFood(null)
    setEquivalents(1)
  }, [
    visible,
  ])
  const foods = useMemo(() => {
    if (!normalizedQuery) return selectedGroup ? CATALOG_BY_GROUP[selectedGroup] : []

    return CATALOG_SEARCH_INDEX.filter(
      ({ food, searchText }) =>
        (!selectedGroup || food.group === selectedGroup) && searchText.includes(normalizedQuery),
    ).map(({ food }) => food)
  }, [
    normalizedQuery,
    selectedGroup,
  ])
  const chooseFood = useCallback(
    (food: Food) => {
      setSelectedFood(food)
      setEquivalents(1)
      resetToTop()
    },
    [
      resetToTop,
    ],
  )
  const renderFood = useCallback(
    ({ item }: { item: Food }) => <CatalogFoodRow food={item} onChoose={chooseFood} />,
    [
      chooseFood,
    ],
  )
  const selectSource = (value: 'smae' | 'external') => {
    setSource(value)
    if (value === 'external') {
      setQuery('')
      setSelectedGroup(null)
      setSelectedFood(null)
    }
    resetToTop()
  }
  const field = (key: keyof ExternalFoodForm, label: string, placeholder = '0') => (
    <View className='mb-4'>
      <Text className='font-geist-mono text-sm text-zinc-600 pl-2 mb-1'>{label}</Text>
      <BottomSheetTextInput
        value={form[key]}
        onChangeText={(v) =>
          setForm({
            ...form,
            [key]: v,
          })
        }
        keyboardType={key === 'name' ? 'default' : 'decimal-pad'}
        placeholder={placeholder}
        placeholderTextColor='#a1a1aa'
        className='border border-zinc-200 bg-zinc-50 rounded-full p-4 font-geist-mono text-zinc-950'
      />
    </View>
  )

  if (!visible) return null

  return (
    <BottomSheetModal
      ref={sheetRef}
      index={0}
      enableDynamicSizing
      maxDynamicContentSize={height * 0.92}
      enablePanDownToClose
      keyboardBehavior='extend'
      keyboardBlurBehavior='restore'
      backdropComponent={renderBackdrop}
      onDismiss={close}
      backgroundStyle={{
        backgroundColor: '#f7f7f5',
      }}
      handleIndicatorStyle={{
        backgroundColor: '#a1a1aa',
      }}
    >
      <BottomSheetFlatList
        ref={listRef}
        data={source === 'smae' && !selectedFood ? foods : []}
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
          minHeight: source === 'smae' && !selectedFood ? height * 0.7 : undefined,
        }}
        ListHeaderComponent={
          <>
            <View className='flex-row justify-between items-center mb-5'>
              <View className='flex-row items-center gap-3'>
                {source === 'smae' && (selectedFood || !isBrowsingGroups) && (
                  <TouchableOpacity
                    accessibilityLabel={selectedFood ? 'Volver al catálogo' : 'Volver a grupos'}
                    hitSlop={8}
                    onPress={() => {
                      if (selectedFood) setSelectedFood(null)
                      else {
                        setQuery('')
                        setSelectedGroup(null)
                      }
                      resetToTop()
                    }}
                    className='w-10 h-10 rounded-full bg-white border border-zinc-200 items-center justify-center active:opacity-60'
                  >
                    <Feather name='arrow-left' size={18} color='#52525b' />
                  </TouchableOpacity>
                )}
                <Text className='font-geist-mono text-xl'>Registrar alimento</Text>
              </View>
              <TouchableOpacity onPress={close}>
                <Feather name='x' size={22} />
              </TouchableOpacity>
            </View>
            {(source === 'external' || (isBrowsingGroups && !selectedFood)) && (
              <View className='flex-row mb-5 gap-2'>
                <TouchableOpacity
                  onPress={() => selectSource('smae')}
                  className={`flex-1 px-3 py-3 rounded-full ${source === 'smae' ? 'bg-zinc-950' : 'bg-zinc-200'}`}
                >
                  <Text
                    className={`font-geist-mono text-center text-base ${source === 'smae' ? 'text-white' : 'text-zinc-700'}`}
                  >
                    SMAE
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => selectSource('external')}
                  className={`flex-1 px-3 py-3 rounded-full ${source === 'external' ? 'bg-zinc-950' : 'bg-zinc-200'}`}
                >
                  <Text
                    className={`font-geist-mono text-center text-base ${source === 'external' ? 'text-white' : 'text-zinc-700'}`}
                  >
                    Externo
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {source === 'smae' ? (
              <>
                {selectedFood ? (
                  <View className='bg-white rounded-3xl border border-zinc-200 p-4 mb-4'>
                    <Text className='font-geist-mono text-lg text-zinc-950'>
                      {selectedFood.name}
                    </Text>
                    <Text className='font-geist-mono text-sm text-zinc-500 mt-1'>
                      {selectedFood.group} · {selectedFood.portion}
                    </Text>
                    <Text className='font-geist-mono text-sm text-zinc-500 mt-4 mb-3'>
                      Equivalentes
                    </Text>
                    <View className='flex-row items-center gap-2'>
                      <TouchableOpacity
                        onPress={() => setEquivalents((value) => Math.max(0.5, value - 0.5))}
                        className='bg-zinc-100 w-11 h-11 rounded-full items-center justify-center'
                      >
                        <Feather name='minus' size={14} />
                      </TouchableOpacity>
                      <Text className='font-geist-mono text-center text-lg w-14 text-zinc-950'>
                        {equivalents}
                      </Text>
                      <TouchableOpacity
                        onPress={() => setEquivalents((value) => value + 0.5)}
                        className='bg-zinc-950 w-11 h-11 rounded-full items-center justify-center'
                      >
                        <Feather name='plus' color='white' size={14} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <>
                    <View className='flex-row items-center mb-3'>
                      <View className='flex-1 flex-row items-center border border-zinc-200 bg-white rounded-full'>
                        <BottomSheetTextInput
                          value={query}
                          onChangeText={(value) => {
                            setQuery(value)
                            resetToTop()
                          }}
                          placeholder='Buscar alimento'
                          placeholderTextColor='#a1a1aa'
                          className='flex-1 py-4 pl-4 font-geist-mono text-zinc-950'
                        />
                        {query.length > 0 && (
                          <TouchableOpacity
                            accessibilityLabel='Borrar búsqueda'
                            onPress={() => {
                              setQuery('')
                              resetToTop()
                            }}
                            className='w-11 h-11 pr-2 items-center justify-center'
                          >
                            <Feather name='x' size={18} color='#71717a' />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                    {isBrowsingGroups ? (
                      <View className='flex-row flex-wrap gap-2 mb-4'>
                        {GROUPS.map((group) => (
                          <TouchableOpacity
                            key={group}
                            onPress={() => {
                              setSelectedGroup(group)
                              resetToTop()
                            }}
                            className='w-[49%] bg-white border border-zinc-200 rounded-2xl p-3 justify-between'
                          >
                            <Text className='font-geist-mono text-base text-zinc-900'>{group}</Text>
                            <Text className='font-geist-mono text-sm text-zinc-500 mt-1'>
                              {CATALOG_BY_GROUP[group].length} alimentos
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : foods.length ? null : (
                      <Text className='font-geist-mono text-base text-zinc-500 py-6'>
                        No encontramos alimentos con esa búsqueda.
                      </Text>
                    )}
                  </>
                )}
                {selectedFood && (
                  <MealPicker
                    meals={meals}
                    mealId={form.mealId}
                    setMealId={(mealId) =>
                      setForm({
                        ...form,
                        mealId,
                      })
                    }
                  />
                )}
                {selectedFood && (
                  <TouchableOpacity
                    onPress={() => saveSmae(selectedFood, equivalents, form.mealId)}
                    className='bg-zinc-950 rounded-full p-4'
                  >
                    <Text className='font-geist-mono text-center text-white'>
                      Registrar equivalente
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <>
                {field('name', 'Nombre', 'Ej. Yogur natural')}
                {field('kcal', 'kcal de etiqueta', '120')}
                <View className='flex-row mb-4 gap-2'>
                  <TouchableOpacity
                    onPress={() => setMode('macros')}
                    className={`flex-1 p-3 rounded-full ${mode === 'macros' ? 'bg-zinc-950' : 'bg-zinc-200'}`}
                  >
                    <Text
                      className={`font-geist-mono text-center text-sm ${mode === 'macros' ? 'text-white' : 'text-zinc-700'}`}
                    >
                      Completa
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setMode('calories')}
                    className={`flex-1 p-3 rounded-full ${mode === 'calories' ? 'bg-zinc-950' : 'bg-zinc-200'}`}
                  >
                    <Text
                      className={`font-geist-mono text-center text-sm ${mode === 'calories' ? 'text-white' : 'text-zinc-700'}`}
                    >
                      Solo calorías
                    </Text>
                  </TouchableOpacity>
                </View>
                {mode === 'macros' && (
                  <View className='flex-row gap-2'>
                    <View className='flex-1'>{field('protein', 'Proteína (g)', '8')}</View>
                    <View className='flex-1'>{field('carbs', 'Carbos (g)', '12')}</View>
                    <View className='flex-1'>{field('fat', 'Grasa (g)', '4')}</View>
                  </View>
                )}
                <View className='flex-row gap-3'>
                  <View className='flex-1'>{field('ref', 'Porción etiqueta\n(g/ml)', '100')}</View>
                  <View className='flex-1'>
                    {field('eaten', 'Porción consumida\n(g/ml)', '100')}
                  </View>
                </View>
                <MealPicker
                  meals={meals}
                  mealId={form.mealId}
                  setMealId={(mealId) =>
                    setForm({
                      ...form,
                      mealId,
                    })
                  }
                />
                <View className='h-4' />
                <TouchableOpacity onPress={saveExternal} className='bg-zinc-950 rounded-full p-4'>
                  <Text className='font-geist-mono text-center text-white'>Guardar alimento</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        }
        renderItem={renderFood}
      />
    </BottomSheetModal>
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

function MealPicker({
  meals,
  mealId,
  setMealId,
}: {
  meals: {
    id: string
    name: string
  }[]
  mealId: string
  setMealId: (mealId: string) => void
}) {
  return (
    <>
      <Text className='font-geist-mono text-sm text-zinc-600 mb-2'>Comida</Text>
      <View className='flex-row flex-wrap gap-2 mb-5'>
        {meals.map((meal) => (
          <TouchableOpacity
            key={meal.id}
            onPress={() => setMealId(meal.id)}
            className={`px-4 py-2 rounded-full ${mealId === meal.id ? 'bg-zinc-950' : 'bg-zinc-200'}`}
          >
            <Text
              className={`font-geist-mono text-sm ${mealId === meal.id ? 'text-white' : 'text-zinc-700'}`}
            >
              {meal.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  )
}
