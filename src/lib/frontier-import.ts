import {
  frontierExerciseIdentity,
  normalizeFrontierBodyPart,
  normalizeFrontierEquipment,
  parseFrontierExerciseName,
} from "@/lib/frontier-structure"
import { parseFrontierMarkHistory } from "@/lib/frontier-marks"
import { FrontierBodyPart, FrontierMetric, FrontierValue } from "@/types/frontier"

export interface SpreadsheetImportMark {
  rawValue: string
  value?: FrontierValue
}

export interface SpreadsheetImportRow {
  sourceRow: number
  name: string
  equipment?: string
  bodyPart?: FrontierBodyPart
  metric: FrontierMetric
  marks: SpreadsheetImportMark[]
  warnings: string[]
}

export interface SpreadsheetImportResult {
  rows: SpreadsheetImportRow[]
  suggestedCardName: string | null
  skippedRows: number
  ignoredBoundaryCells: number
}

interface StructuredHeader {
  rowIndex: number
  equipmentColumn: number
  bodyPartColumn: number
  exerciseColumn: number
}

export function parseSpreadsheetPaste(text: string): SpreadsheetImportResult {
  const table = parseTabularText(text.replace(/^\uFEFF/, ""))
  const rows: SpreadsheetImportRow[] = []
  const rowsByName = new Map<string, SpreadsheetImportRow>()
  let suggestedCardName: string | null = null
  let skippedRows = 0
  let ignoredBoundaryCells = 0
  const structuredHeader = findStructuredHeader(table)

  table.forEach((sourceCells, rowIndex) => {
    const cells = sourceCells.map(normalizeCell)
    if (cells.every((cell) => !cell)) return

    if (structuredHeader && rowIndex < structuredHeader.rowIndex) {
      const nonBoundaryValues = cells.filter((cell) => cell && !isBoundaryCell(cell))
      ignoredBoundaryCells += cells.filter((cell) => isBoundaryCell(cell)).length
      if (!suggestedCardName && nonBoundaryValues.length === 1) {
        suggestedCardName = nonBoundaryValues[0]
      }
      return
    }
    if (structuredHeader && rowIndex === structuredHeader.rowIndex) return

    const sourceName = structuredHeader
      ? cells[structuredHeader.exerciseColumn] ?? ""
      : cells[0] ?? ""
    const parsedName = structuredHeader ? null : parseFrontierExerciseName(sourceName)
    const name = parsedName?.name ?? sourceName
    const equipmentValue = structuredHeader
      ? cells[structuredHeader.equipmentColumn] ?? ""
      : parsedName?.equipment ?? ""
    const equipment = equipmentValue ? normalizeFrontierEquipment(equipmentValue) : undefined
    const bodyPartValue = structuredHeader
      ? cells[structuredHeader.bodyPartColumn] ?? ""
      : parsedName?.bodyPart
    const bodyPart = normalizeFrontierBodyPart(bodyPartValue) ?? undefined
    const markStart = structuredHeader
      ? Math.max(
          structuredHeader.equipmentColumn,
          structuredHeader.bodyPartColumn,
          structuredHeader.exerciseColumn
        ) + 1
      : 1
    const remainingValues = cells.slice(markStart).filter(Boolean)

    if (!name) {
      const nonBoundaryValues = remainingValues.filter((cell) => !isBoundaryCell(cell))
      ignoredBoundaryCells += remainingValues.length - nonBoundaryValues.length
      if (!suggestedCardName && nonBoundaryValues.length === 1) {
        suggestedCardName = nonBoundaryValues[0]
      } else {
        skippedRows += 1
      }
      return
    }

    if (/^exercise(?:\s+name)?$/i.test(name)) return

    const rawMarks: string[] = []
    cells.slice(markStart).forEach((cell) => {
      if (!cell) return
      if (isBoundaryCell(cell)) {
        ignoredBoundaryCells += 1
        return
      }
      rawMarks.push(cell)
    })

    const parsedHistory = parseFrontierMarkHistory(rawMarks)
    const metric = parsedHistory?.metric ?? "freeform"
    const warnings: string[] = []

    if (!equipment) {
      warnings.push("Station / area is missing; this exercise will be placed under Unassigned station")
    }
    if (!bodyPart) {
      warnings.push("Body part is missing; use Legs, Back, Shoulders, Core, Chest, or Arms")
    }

    if (rawMarks.some((mark) => /^\d+(?:\.\d+)?\s*b\s*\//i.test(mark))) {
      warnings.push("Possible weight-unit typo kept as a custom mark")
    }

    const marks = dedupeSpreadsheetMarks(rawMarks.map((rawValue, index) => ({
      rawValue,
      ...(parsedHistory ? { value: parsedHistory.marks[index].value } : {}),
    })))

    const normalizedName = frontierExerciseIdentity({ name, equipment, bodyPart })
    const duplicate = rowsByName.get(normalizedName)
    if (duplicate) {
      const mergedRawMarks = [...duplicate.marks.map((mark) => mark.rawValue), ...rawMarks]
      const mergedHistory = parseFrontierMarkHistory(mergedRawMarks)
      duplicate.metric = mergedHistory?.metric ?? "freeform"
      duplicate.marks = dedupeSpreadsheetMarks(mergedRawMarks.map((rawValue, index) => ({
        rawValue,
        ...(mergedHistory ? { value: mergedHistory.marks[index].value } : {}),
      })))
      duplicate.warnings.push(...warnings, `Also found on spreadsheet row ${rowIndex + 1}`)
      return
    }

    const row: SpreadsheetImportRow = {
      sourceRow: rowIndex + 1,
      name,
      ...(equipment ? { equipment } : {}),
      ...(bodyPart ? { bodyPart } : {}),
      metric,
      marks,
      warnings,
    }
    rows.push(row)
    rowsByName.set(normalizedName, row)
  })

  return {
    rows,
    suggestedCardName,
    skippedRows,
    ignoredBoundaryCells,
  }
}

function findStructuredHeader(table: string[][]): StructuredHeader | null {
  for (let rowIndex = 0; rowIndex < table.length; rowIndex += 1) {
    const cells = table[rowIndex].map((cell) => normalizeCell(cell).toLocaleLowerCase())
    const equipmentColumn = cells.findIndex((cell) => (
      /^(?:equipment|station|station\s*\/\s*area)$/.test(cell)
    ))
    const bodyPartColumn = cells.findIndex((cell) => /^(?:body\s*part|area)$/.test(cell))
    const exerciseColumn = cells.findIndex((cell) => /^exercise(?:\s+name)?$/.test(cell))
    if (equipmentColumn >= 0 && bodyPartColumn >= 0 && exerciseColumn >= 0) {
      return { rowIndex, equipmentColumn, bodyPartColumn, exerciseColumn }
    }
  }
  return null
}

export function parseTabularText(text: string): string[][] {
  if (!text) return []

  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false

  const finishField = () => {
    row.push(field)
    field = ""
  }

  const finishRow = () => {
    finishField()
    rows.push(row)
    row = []
  }

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]

    if (character === '"') {
      if (inQuotes && text[index + 1] === '"') {
        field += '"'
        index += 1
      } else if (inQuotes || field.length === 0) {
        inQuotes = !inQuotes
      } else {
        field += character
      }
      continue
    }

    if (!inQuotes && character === "\t") {
      finishField()
      continue
    }

    if (!inQuotes && (character === "\n" || character === "\r")) {
      finishRow()
      if (character === "\r" && text[index + 1] === "\n") index += 1
      continue
    }

    field += character
  }

  if (field || row.length > 0) finishRow()
  return rows
}

function normalizeCell(value: string): string {
  return value.replace(/\u00a0/g, " ").trim()
}

function isBoundaryCell(value: string): boolean {
  return /^x$/i.test(value.trim())
}

function dedupeSpreadsheetMarks(marks: SpreadsheetImportMark[]): SpreadsheetImportMark[] {
  return marks.reduce<SpreadsheetImportMark[]>((deduped, mark) => {
    const previous = deduped.at(-1)
    const valuesMatch = previous?.value && mark.value
      ? previous.value.primary === mark.value.primary
        && (previous.value.secondary ?? null) === (mark.value.secondary ?? null)
      : false
    const rawValuesMatch = !previous?.value && !mark.value
      && previous?.rawValue.trim() === mark.rawValue.trim()

    if (previous && (valuesMatch || rawValuesMatch)) {
      deduped[deduped.length - 1] = mark
    } else {
      deduped.push(mark)
    }
    return deduped
  }, [])
}
