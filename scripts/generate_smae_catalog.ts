import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import * as XLSX from 'xlsx'

const GROUP_MAP = {
  Verdura: 'Verduras',
  Frutas: 'Frutas',
  'Cereales sin grasa': 'Cereales · sin grasa',
  'Cereales con grasa': 'Cereales · con grasa',
  Leguminosas: 'Leguminosas',
  'A.O.A Muy bajos en grasa': 'AOA · muy bajo aporte de grasa',
  'A.O.A Bajo en grasa': 'AOA · bajo aporte de grasa',
  'A.O.A Moderados en grasa': 'AOA · moderado aporte de grasa',
  'A.O.A Alto en grasa': 'AOA · alto aporte de grasa',
  'Leche descremada': 'Leche · descremada',
  'Leche semidescremada': 'Leche · semidescremada',
  'Leche entera': 'Leche · entera',
  'Aceites y grasas': 'Grasas · sin proteína',
  'Aceites y grasas con proteínas': 'Grasas · con proteína',
} as const

type SmaeGroup = (typeof GROUP_MAP)[keyof typeof GROUP_MAP]
type CatalogEntry = {
  id: string
  name: string
  group: SmaeGroup
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
  const group = GROUP_MAP[sourceGroup as keyof typeof GROUP_MAP]

  if (!group) return entries

  const name = String(row[foodColumn] ?? '').trim()
  const unit = String(row[unitColumn] ?? '').trim()
  const quantity = Number(row[quantityColumn])
  const sourceRow = index + 2

  if (!name || !unit || !Number.isFinite(quantity) || quantity <= 0)
    throw new Error(`Fila ${sourceRow}: alimento, cantidad o unidad inválidos.`)

  entries.push({
    id: `smae-${sourceRow}`,
    name,
    group,
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
