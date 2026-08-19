import { parseDuration } from "@/lib/frontier-utils"
import {
  frontierExerciseIdentity,
  normalizeFrontierBodyPart,
  normalizeFrontierEquipment,
  parseFrontierExerciseName,
} from "@/lib/frontier-structure"
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

interface StructuredMark {
  metric: "weight-time" | "weight" | "reps" | "speed"
  value: FrontierValue
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

    const parsedMarks = rawMarks.map(parseStructuredMark)
    const metric = inferRowMetric(parsedMarks)
    const warnings: string[] = []

    if (structuredHeader && !equipment) {
      warnings.push("Equipment is missing; this exercise will be ungrouped")
    }
    if (structuredHeader && !bodyPart) {
      warnings.push("Body part must be Legs, Back, Shoulders, Core, Chest, or Arms")
    }

    if (rawMarks.some((mark) => /^\d+(?:\.\d+)?\s*b\s*\//i.test(mark))) {
      warnings.push("Possible weight-unit typo kept as a custom mark")
    }

    const marks = rawMarks.map((rawValue, index) => {
      const parsed = parsedMarks[index]
      if (metric === "freeform" || !parsed) return { rawValue }
      return { rawValue, value: parsed.value }
    })

    const normalizedName = frontierExerciseIdentity({ name, equipment, bodyPart })
    const duplicate = rowsByName.get(normalizedName)
    if (duplicate) {
      const mergedRawMarks = [...duplicate.marks.map((mark) => mark.rawValue), ...rawMarks]
      const mergedParsedMarks = mergedRawMarks.map(parseStructuredMark)
      duplicate.metric = inferRowMetric(mergedParsedMarks)
      duplicate.marks = mergedRawMarks.map((rawValue, index) => {
        const parsed = mergedParsedMarks[index]
        if (duplicate.metric === "freeform" || !parsed) return { rawValue }
        return { rawValue, value: parsed.value }
      })
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
    const equipmentColumn = cells.findIndex((cell) => /^(?:equipment|station)$/.test(cell))
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

function parseStructuredMark(rawValue: string): StructuredMark | null {
  const weightTime = rawValue.match(
    /^(\d+(?:\.\d+)?)\s*(?:lb|lbs|pounds?|#)\s*\/\s*(.+)$/i
  )
  if (weightTime) {
    const seconds = parseDuration(weightTime[2])
    if (seconds !== null && seconds > 0) {
      return {
        metric: "weight-time",
        value: { primary: Number(weightTime[1]), secondary: seconds },
      }
    }
  }

  const weight = rawValue.match(/^(\d+(?:\.\d+)?)\s*(?:lb|lbs|pounds?|#)$/i)
  if (weight) {
    return { metric: "weight", value: { primary: Number(weight[1]) } }
  }

  const reps = rawValue.match(/^(\d+)\s*(?:reps?|x)$/i)
  if (reps) {
    return { metric: "reps", value: { primary: Number(reps[1]) } }
  }

  const speed = rawValue.match(/^(\d+(?:\.\d+)?)\s*mph$/i)
  if (speed) {
    return { metric: "speed", value: { primary: Number(speed[1]) } }
  }

  return null
}

function inferRowMetric(parsedMarks: Array<StructuredMark | null>): FrontierMetric {
  if (parsedMarks.length === 0 || parsedMarks.some((mark) => mark === null)) {
    return "freeform"
  }

  const metrics = new Set(parsedMarks.map((mark) => mark!.metric))
  if ([...metrics].every((metric) => metric === "weight" || metric === "weight-time")) {
    return metrics.has("weight-time") ? "weight-time" : "weight"
  }

  return metrics.size === 1 ? parsedMarks[0]!.metric : "freeform"
}
