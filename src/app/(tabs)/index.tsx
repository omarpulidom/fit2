import { Feather } from '@expo/vector-icons'
import { useMemo, useState } from 'react'
import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { GROUP_MACROS } from '@/features/smae/data'
import { useSmaeStore } from '@/features/smae/store'
import type { Macro } from '@/features/smae/types'

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
  const [mode, setMode] = useState<'macros' | 'calories'>('macros')
  const [form, setForm] = useState({
    name: '',
    kcal: '',
    protein: '',
    carbs: '',
    fat: '',
    ref: '100',
    eaten: '100',
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
  const save = () => {
    if (!form.name.trim() || !Number(form.kcal) || !Number(form.ref) || !Number(form.eaten))
      return Alert.alert('Completa nombre, calorías y porciones.')
    addExternal({
      name: form.name.trim(),
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
    setModal(false)
    setForm({
      ...form,
      name: '',
      kcal: '',
      protein: '',
      carbs: '',
      fat: '',
    })
  }
  const progress = (label: string, used: number, target: number) => (
    <View className='mb-3'>
      <View className='flex-row justify-between'>
        <Text className='text-zinc-600 font-mono text-xs'>{label}</Text>
        <Text className='text-zinc-900 font-mono text-xs'>
          {n(used)} / {n(target)}
        </Text>
      </View>
      <View className='mt-1 h-1.5 bg-zinc-100 rounded'>
        <View
          className='h-1.5 bg-zinc-900 rounded'
          style={{
            width: `${Math.min(100, target ? (used / target) * 100 : 0)}%`,
          }}
        />
      </View>
    </View>
  )
  return (
    <SafeAreaView className='flex-1 bg-[#f7f7f5]'>
      <ScrollView contentContainerClassName='px-5 pt-5 pb-6' showsVerticalScrollIndicator={false}>
        <View className='flex-row justify-between items-start mb-7'>
          <View>
            <Text className='font-mono text-[11px] tracking-widest text-zinc-500'>SMAE / HOY</Text>
            <Text className='font-mono text-3xl text-zinc-950 mt-1'>Tu día</Text>
          </View>
          <TouchableOpacity
            onPress={() => setModal(true)}
            className='bg-zinc-950 rounded-full px-4 py-3 flex-row gap-2'
          >
            <Feather name='plus' color='white' size={16} />
            <Text className='text-white font-mono text-xs'>Registrar</Text>
          </TouchableOpacity>
        </View>
        <View className='bg-white rounded-3xl p-5 border border-zinc-100 mb-4'>
          <Text className='font-mono text-xs text-zinc-500 mb-5'>PROGRESO DEL DÍA</Text>
          {progress('Energía · kcal', consumed.kcal, plan.kcal)}
          {progress('Proteína · g', consumed.protein, plan.protein)}
          {progress('Carbohidratos · g', consumed.carbs, plan.carbs)}
          {progress('Grasa · g', consumed.fat, plan.fat)}
          <Text className='font-mono text-[11px] text-zinc-400 mt-2'>
            Meta basada en tus equivalentes configurados.
          </Text>
        </View>
        <View className='bg-white rounded-3xl p-5 border border-zinc-100 mb-4'>
          <View className='flex-row justify-between items-center mb-3'>
            <Text className='font-mono text-xs text-zinc-500'>REGISTRO</Text>
            <Text className='font-mono text-xs text-zinc-400'>
              {externalFoods.length} alimentos
            </Text>
          </View>
          {externalFoods.length === 0 ? (
            <Text className='font-mono text-sm text-zinc-500 leading-6'>
              Aún no registras alimentos. Añade un alimento SMAE desde tu plan o uno externo aquí.
            </Text>
          ) : (
            externalFoods.map((f) => (
              <View key={f.id} className='py-3 border-t border-zinc-100 flex-row justify-between'>
                <View>
                  <Text className='font-mono text-sm text-zinc-900'>{f.name}</Text>
                  <Text className='font-mono text-[11px] text-zinc-500'>
                    {meals.find((m) => m.id === f.mealId)?.name} ·{' '}
                    {f.mode === 'macros' ? 'macros completos' : 'solo kcal'}
                  </Text>
                </View>
                <Text className='font-mono text-sm'>
                  {n((f.macro.kcal * f.eatenPortion) / f.referencePortion)} kcal
                </Text>
              </View>
            ))
          )}
        </View>
        <View className='bg-zinc-950 rounded-3xl p-5'>
          <Text className='text-white font-mono text-lg'>Reajuste dinámico</Text>
          <Text className='text-zinc-400 font-mono text-xs leading-5 mt-2'>
            Compensa kcal no asignadas con cereales sin grasa y grasas sin proteína. Tus grupos base
            no se modifican.
          </Text>
          {adjustment?.status === 'pending' ? (
            <View className='mt-4'>
              <Text className='text-white font-mono text-xs'>
                Propuesta: {n(-(adjustment.delta['Cereales · sin grasa'] ?? 0))} cereales y{' '}
                {n(-(adjustment.delta['Grasas · sin proteína'] ?? 0))} grasas
              </Text>
              {adjustment.remainingKcal > 0 && (
                <Text className='text-amber-300 font-mono text-xs mt-2'>
                  Quedan {n(adjustment.remainingKcal)} kcal sin compensar.
                </Text>
              )}
              <TouchableOpacity
                onPress={applyAdjustment}
                className='bg-white rounded-full p-3 mt-4'
              >
                <Text className='text-zinc-950 font-mono text-center text-xs'>
                  Aplicar propuesta
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={proposeAdjustment}
              className='border border-zinc-600 rounded-full p-3 mt-4'
            >
              <Text className='text-white font-mono text-center text-xs'>Ver propuesta</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
      <FoodModal
        visible={modal}
        close={() => setModal(false)}
        mode={mode}
        setMode={setMode}
        form={form}
        setForm={setForm}
        meals={meals}
        save={save}
      />
    </SafeAreaView>
  )
}

function FoodModal({ visible, close, mode, setMode, form, setForm, meals, save }: any) {
  const field = (key: string, label: string) => (
    <View className='mb-3'>
      <Text className='font-mono text-xs text-zinc-600 mb-1'>{label}</Text>
      <TextInput
        value={form[key]}
        onChangeText={(v) =>
          setForm({
            ...form,
            [key]: v,
          })
        }
        keyboardType={key === 'name' ? 'default' : 'decimal-pad'}
        placeholder='0'
        placeholderTextColor='#a1a1aa'
        className='border border-zinc-200 bg-zinc-50 rounded-full px-4 py-3 font-mono text-zinc-950'
      />
    </View>
  )
  return (
    <Modal visible={visible} animationType='slide' transparent>
      <View className='flex-1 bg-black/30 justify-end'>
        <View className='bg-[#f7f7f5] rounded-t-3xl p-5 max-h-[92%]'>
          <View className='flex-row justify-between mb-5'>
            <Text className='font-mono text-xl'>Alimento externo</Text>
            <TouchableOpacity onPress={close}>
              <Feather name='x' size={22} />
            </TouchableOpacity>
          </View>
          <View className='flex-row mb-4 gap-2'>
            <TouchableOpacity
              onPress={() => setMode('macros')}
              className={`px-3 py-2 rounded-full ${mode === 'macros' ? 'bg-zinc-950' : 'bg-zinc-200'}`}
            >
              <Text
                className={`font-mono text-xs ${mode === 'macros' ? 'text-white' : 'text-zinc-700'}`}
              >
                Completa
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMode('calories')}
              className={`px-3 py-2 rounded-full ${mode === 'calories' ? 'bg-zinc-950' : 'bg-zinc-200'}`}
            >
              <Text
                className={`font-mono text-xs ${mode === 'calories' ? 'text-white' : 'text-zinc-700'}`}
              >
                Solo calorías
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {field('name', 'Nombre')}
            {field('kcal', 'kcal de etiqueta')}
            {mode === 'macros' && (
              <View className='flex-row gap-2'>
                <View className='flex-1'>{field('protein', 'Proteína (g)')}</View>
                <View className='flex-1'>{field('carbs', 'Carbos (g)')}</View>
                <View className='flex-1'>{field('fat', 'Grasa (g)')}</View>
              </View>
            )}
            <View className='flex-row gap-3'>
              <View className='flex-1'>{field('ref', 'Porción etiqueta (g/ml)')}</View>
              <View className='flex-1'>{field('eaten', 'Porción consumida')}</View>
            </View>
            <Text className='font-mono text-xs text-zinc-600 mb-2'>Comida</Text>
            <View className='flex-row flex-wrap gap-2 mb-5'>
              {meals.map((m: any) => (
                <TouchableOpacity
                  key={m.id}
                  onPress={() =>
                    setForm({
                      ...form,
                      mealId: m.id,
                    })
                  }
                  className={`px-3 py-2 rounded-full ${form.mealId === m.id ? 'bg-zinc-950' : 'bg-zinc-200'}`}
                >
                  <Text
                    className={`font-mono text-xs ${form.mealId === m.id ? 'text-white' : 'text-zinc-700'}`}
                  >
                    {m.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text className='font-mono text-[11px] text-zinc-500 mb-4'>
              Puedes tomar o seleccionar la etiqueta al registrar; esta v1 conserva el formulario
              editable y no lee texto de imágenes.
            </Text>
            <TouchableOpacity onPress={save} className='bg-zinc-950 rounded-full p-4 mb-4'>
              <Text className='font-mono text-center text-white'>Guardar alimento</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}
