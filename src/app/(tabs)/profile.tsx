import { Feather } from '@expo/vector-icons'
import { useEffect, useMemo, useState } from 'react'
import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { GROUP_MACROS, GROUPS } from '@/features/smae/data'
import { useSmaeStore } from '@/features/smae/store'
import type { Macro, Meal } from '@/features/smae/types'

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

export default function PlanTab() {
  const { meals, catalog, setExchange, addMeal, renameMeal, removeMeal, addExternal } =
    useSmaeStore()
  const [activeMealId, setActiveMealId] = useState(meals[0]?.id ?? '')
  const [managerOpen, setManagerOpen] = useState(false)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const activeMeal = meals.find((meal) => meal.id === activeMealId) ?? meals[0]
  const mealTotal = useMemo(
    () => (activeMeal ? macroFor(activeMeal) : empty),
    [
      activeMeal,
    ],
  )
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
    <SafeAreaView className='flex-1 bg-[#f7f7f5]'>
      <ScrollView contentContainerClassName='pb-6' showsVerticalScrollIndicator={false}>
        <View className='px-5 pt-5'>
          <View className='flex-row justify-between items-start'>
            <View>
              <Text className='font-geist-mono text-[11px] tracking-widest text-zinc-500'>
                CONFIGURACIÓN
              </Text>
              <Text className='font-geist-mono text-3xl text-zinc-950 mt-1'>Equivalentes</Text>
            </View>
            <TouchableOpacity
              onPress={() => setManagerOpen(true)}
              className='border border-zinc-300 rounded-full px-3 py-2 flex-row gap-2'
            >
              <Feather name='edit-3' size={14} color='#3f3f46' />
              <Text className='font-geist-mono text-xs text-zinc-800'>Editar comidas</Text>
            </TouchableOpacity>
          </View>
          <Text className='font-geist-mono text-sm text-zinc-500 leading-5 mt-3 mb-5'>
            Selecciona una comida y asigna sus equivalentes. El resumen se actualiza al instante.
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
                className={`font-geist-mono text-xs ${meal.id === activeMeal.id ? 'text-white' : 'text-zinc-600'}`}
              >
                {meal.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View className='mx-5 bg-white rounded-3xl p-5 border border-zinc-100'>
          <View className='flex-row justify-between items-baseline mb-3'>
            <Text className='font-geist-mono text-base text-zinc-950'>{activeMeal.name}</Text>
            <Text className='font-geist-mono text-[11px] text-zinc-400'>equivalentes</Text>
          </View>
          {GROUPS.map((group) => (
            <View
              key={group}
              className='flex-row items-center justify-between py-3 border-t border-zinc-100'
            >
              <Text className='font-geist-mono text-xs text-zinc-800 flex-1 pr-3'>{group}</Text>
              <View className='flex-row items-center gap-3'>
                <TouchableOpacity
                  accessibilityLabel={`Restar ${group}`}
                  onPress={() =>
                    setExchange(activeMeal.id, group, (activeMeal.exchanges[group] ?? 0) - 0.5)
                  }
                  className='bg-zinc-100 w-8 h-8 rounded-full items-center justify-center'
                >
                  <Feather name='minus' size={14} />
                </TouchableOpacity>
                <TextInput
                  value={`${activeMeal.exchanges[group] ?? 0}`}
                  onChangeText={(value) =>
                    setExchange(activeMeal.id, group, Number(value.replace(',', '.')))
                  }
                  keyboardType='decimal-pad'
                  selectTextOnFocus
                  className='font-geist-mono text-center text-sm w-9 text-zinc-950'
                />
                <TouchableOpacity
                  accessibilityLabel={`Sumar ${group}`}
                  onPress={() =>
                    setExchange(activeMeal.id, group, (activeMeal.exchanges[group] ?? 0) + 0.5)
                  }
                  className='bg-zinc-950 w-8 h-8 rounded-full items-center justify-center'
                >
                  <Feather name='plus' color='white' size={14} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View className='mx-5 mt-4 bg-zinc-950 rounded-3xl p-5'>
          <Text className='font-geist-mono text-[11px] tracking-widest text-zinc-400'>RESUMEN</Text>
          <View className='mt-4 pb-4 border-b border-zinc-700'>
            <Text className='font-geist-mono text-sm text-white'>{activeMeal.name}</Text>
            <MacroLine values={mealTotal} light />
          </View>
          <View className='pt-4'>
            <Text className='font-geist-mono text-sm text-white'>Total del día</Text>
            <MacroLine values={dayTotal} light />
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setCatalogOpen(true)}
          className='mx-5 mt-4 p-4 bg-white border border-zinc-200 rounded-2xl flex-row justify-between items-center'
        >
          <View>
            <Text className='font-geist-mono text-sm text-zinc-900'>Catálogo SMAE</Text>
            <Text className='font-geist-mono text-[11px] text-zinc-500 mt-1'>
              Registrar un alimento por equivalente
            </Text>
          </View>
          <Feather name='book-open' size={18} color='#3f3f46' />
        </TouchableOpacity>
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
      <CatalogModal
        visible={catalogOpen}
        close={() => setCatalogOpen(false)}
        catalog={catalog}
        meals={meals}
        addExternal={addExternal}
      />
    </SafeAreaView>
  )
}

function MacroLine({ values, light = false }: { values: Macro; light?: boolean }) {
  const style = light ? 'text-zinc-300' : 'text-zinc-600'
  return (
    <View className='flex-row flex-wrap items-center mt-2'>
      <Text className={`font-geist-mono text-xs ${style}`}>{number(values.kcal)} kcal</Text>
      <Text className={`font-geist-mono text-xs mx-2 ${style}`}>|</Text>
      <Text className={`font-geist-mono text-xs ${style}`}>P {number(values.protein)}g</Text>
      <Text className={`font-geist-mono text-xs mx-2 ${style}`}>|</Text>
      <Text className={`font-geist-mono text-xs ${style}`}>C {number(values.carbs)}g</Text>
      <Text className={`font-geist-mono text-xs mx-2 ${style}`}>|</Text>
      <Text className={`font-geist-mono text-xs ${style}`}>G {number(values.fat)}g</Text>
    </View>
  )
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
}: any) {
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
    <Modal visible={visible} animationType='slide' transparent onRequestClose={close}>
      <View className='flex-1 bg-black/30 justify-end'>
        <View className='bg-[#f7f7f5] rounded-t-3xl p-5 max-h-[85%]'>
          <View className='flex-row justify-between items-center mb-4'>
            <Text className='font-geist-mono text-xl text-zinc-950'>Editar comidas</Text>
            <TouchableOpacity onPress={close} className='p-1'>
              <Feather name='x' size={22} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {meals.map((meal: Meal) => (
              <View
                key={meal.id}
                className='flex-row items-center gap-2 py-2 border-t border-zinc-200'
              >
                <TextInput
                  value={meal.name}
                  onChangeText={(name) => renameMeal(meal.id, name)}
                  className='flex-1 bg-white border border-zinc-200 rounded-xl px-3 py-3 font-geist-mono text-sm text-zinc-950'
                />
                <TouchableOpacity
                  onPress={() => askRemove(meal)}
                  disabled={meals.length <= 1}
                  className='w-10 h-10 items-center justify-center'
                >
                  <Feather
                    name='trash-2'
                    size={17}
                    color={meals.length <= 1 ? '#d4d4d8' : '#b91c1c'}
                  />
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
              <TouchableOpacity
                onPress={create}
                className='bg-zinc-950 rounded-full px-4 justify-center'
              >
                <Feather name='plus' color='white' />
              </TouchableOpacity>
            </View>
            <Text className='font-geist-mono text-[11px] leading-4 text-zinc-500 mt-4'>
              Puedes añadir, renombrar o eliminar comidas. Debe permanecer al menos una.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

function CatalogModal({ visible, close, catalog, meals, addExternal }: any) {
  const choose = (food: any) =>
    Alert.alert(food.name, '¿En qué comida registras 1 equivalente?', [
      ...meals.map((meal: Meal) => ({
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
        style: 'cancel',
      },
    ])
  return (
    <Modal visible={visible} animationType='slide' transparent onRequestClose={close}>
      <View className='flex-1 bg-black/30 justify-end'>
        <View className='bg-[#f7f7f5] rounded-t-3xl p-5 max-h-[85%]'>
          <View className='flex-row justify-between items-center mb-4'>
            <Text className='font-geist-mono text-xl text-zinc-950'>Catálogo SMAE</Text>
            <TouchableOpacity onPress={close} className='p-1'>
              <Feather name='x' size={22} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {catalog.map((food: any) => (
              <TouchableOpacity
                key={food.id}
                onPress={() => choose(food)}
                className='py-3 border-t border-zinc-200 flex-row justify-between items-center'
              >
                <View className='flex-1 pr-3'>
                  <Text className='font-geist-mono text-sm text-zinc-900'>{food.name}</Text>
                  <Text className='font-geist-mono text-[11px] text-zinc-500 mt-1'>
                    {food.group} · {food.portion}
                  </Text>
                </View>
                <Feather name='plus' size={17} color='#52525b' />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}
