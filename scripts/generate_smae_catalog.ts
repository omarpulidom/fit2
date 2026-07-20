import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import * as XLSX from 'xlsx'

const GROUP_ID_MAP = {
  Verdura: 'vegetables',
  Frutas: 'fruits',
  'Cereales sin grasa': 'cereals_without_fat',
  'Cereales con grasa': 'cereals_with_fat',
  Leguminosas: 'legumes',
  'A.O.A Muy bajos en grasa': 'aoa_very_low_fat',
  'A.O.A Bajo en grasa': 'aoa_low_fat',
  'A.O.A Moderados en grasa': 'aoa_moderate_fat',
  'A.O.A Alto en grasa': 'aoa_high_fat',
  'Leche descremada': 'milk_skim',
  'Leche semidescremada': 'milk_semi_skim',
  'Leche entera': 'milk_whole',
  'Aceites y grasas': 'fats_without_protein',
  'Aceites y grasas con proteínas': 'fats_with_protein',
} as const

type SmaeGroupId = (typeof GROUP_ID_MAP)[keyof typeof GROUP_ID_MAP]
type CatalogEntry = {
  id: string
  name: string
  groupId: SmaeGroupId
  quantity: number
  unit: string
  portion: string
}

const sourcePath = resolve(process.cwd(), 'src/assets/data/SMAE.xlsx')
const outputPath = resolve(process.cwd(), 'src/features/smae/catalog.json')
const workbook = XLSX.readFile(sourcePath)
const worksheet = workbook.Sheets[workbook.SheetNames[0]]

if (!worksheet) throw new Error('No se encontró la primera hoja de SMAE.xlsx.')

const [headers, ...rows] = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
  header: 1,
  defval: null,
  raw: true,
})

const column = (name: string) => {
  const index = headers.indexOf(name)
  if (index < 0) throw new Error(`No se encontró la columna "${name}" en SMAE.xlsx.`)
  return index
}

const groupColumn = column('Grupo')
const foodColumn = column('Alimento')
const quantityColumn = column('Cantidad')
const unitColumn = column('Unidad')

const formatQuantity = (quantity: number) =>
  Number.isInteger(quantity) ? `${quantity}` : `${Number(quantity.toFixed(3))}`

const catalog = rows.reduce<CatalogEntry[]>((entries, row, index) => {
  const sourceGroup = String(row[groupColumn] ?? '').trim()
  const groupId = GROUP_ID_MAP[sourceGroup as keyof typeof GROUP_ID_MAP]

  if (!groupId) return entries

  const name = String(row[foodColumn] ?? '').trim()
  const unit = String(row[unitColumn] ?? '').trim()
  const quantity = Number(row[quantityColumn])
  const sourceRow = index + 2

  if (!name || !unit || !Number.isFinite(quantity) || quantity <= 0)
    throw new Error(`Fila ${sourceRow}: alimento, cantidad o unidad inválidos.`)

  entries.push({
    id: `smae-${sourceRow}`,
    name,
    groupId,
    quantity,
    unit,
    portion: `${formatQuantity(quantity)} ${unit}`,
  })

  return entries
}, [])

if (catalog.length !== 1848)
  throw new Error(`Se esperaban 1848 alimentos permitidos y se generaron ${catalog.length}.`)

if (new Set(catalog.map((food) => food.id)).size !== catalog.length)
  throw new Error('El catálogo contiene IDs duplicados.')

writeFileSync(outputPath, `${JSON.stringify(catalog, null, 2)}\n`)

console.log(`Catálogo SMAE generado: ${catalog.length} alimentos en ${outputPath}`)
