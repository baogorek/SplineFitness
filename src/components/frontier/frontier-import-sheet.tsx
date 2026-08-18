"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, ClipboardPaste, FileSpreadsheet, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  parseSpreadsheetPaste,
  SpreadsheetImportRow,
} from "@/lib/frontier-import"
import { FRONTIER_METRIC_OPTIONS } from "@/lib/frontier-utils"
import { FrontierCard } from "@/types/frontier"

interface FrontierImportSheetProps {
  card: FrontierCard
  onClose: () => void
  onImport: (rows: SpreadsheetImportRow[]) => void
}

export function FrontierImportSheet({ card, onClose, onImport }: FrontierImportSheetProps) {
  const [paste, setPaste] = useState("")
  const parsed = useMemo(() => parseSpreadsheetPaste(paste), [paste])
  const existingExercises = useMemo(
    () => new Map(card.exercises.map((exercise) => [normalizeName(exercise.name), exercise])),
    [card.exercises]
  )

  const importableRows = parsed.rows.filter((row) => {
    const existing = existingExercises.get(normalizeName(row.name))
    return !existing || row.marks.length > 0
  })
  const newExerciseCount = parsed.rows.filter(
    (row) => !existingExercises.has(normalizeName(row.name))
  ).length
  const appendedRows = parsed.rows.filter((row) => {
    const existing = existingExercises.get(normalizeName(row.name))
    return Boolean(existing && row.marks.length > 0)
  })
  const appendedMarkCount = appendedRows.reduce((total, row) => total + row.marks.length, 0)
  const skippedEmptyExistingCount = parsed.rows.length - importableRows.length
  const markCount = parsed.rows.reduce((total, row) => total + row.marks.length, 0)

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close spreadsheet import"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="frontier-import-title"
        className="relative z-10 flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:max-w-2xl sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">
              Spreadsheet import
            </p>
            <h2 id="frontier-import-title" className="mt-1 text-xl font-bold text-slate-900">
              Paste into {card.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Works with copied cells from Google Sheets and Excel.
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <label htmlFor="frontier-spreadsheet-paste" className="text-sm font-semibold text-slate-700">
            Copied cells
          </label>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            Put exercise names in the first column and older-to-newer marks in the columns to the right.
            Matching exercises get new marks appended; existing history is never replaced.
          </p>
          <textarea
            id="frontier-spreadsheet-paste"
            value={paste}
            onChange={(event) => setPaste(event.target.value)}
            placeholder={"Exercise name\t20 lb / 1:00\t20 lb / 1:30"}
            autoFocus
            spellCheck={false}
            className="mt-3 min-h-28 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 font-mono text-sm text-slate-800 shadow-inner outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />

          {!paste.trim() ? (
            <div className="mt-5 flex flex-col items-center rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 px-6 py-8 text-center">
              <ClipboardPaste className="h-8 w-8 text-indigo-400" />
              <p className="mt-3 text-sm font-semibold text-slate-700">Copy a cell range, then paste here</p>
              <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-400">
                Blank measurements are fine. Cells containing only “x” are ignored.
              </p>
            </div>
          ) : parsed.rows.length === 0 ? (
            <div className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              No exercise rows were found. Make sure the first pasted column contains exercise names.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <SummaryPill>
                  {parsed.rows.length} exercise{parsed.rows.length === 1 ? "" : "s"}
                </SummaryPill>
                <SummaryPill>{markCount} mark{markCount === 1 ? "" : "s"}</SummaryPill>
                {newExerciseCount > 0 && (
                  <SummaryPill>
                    {newExerciseCount} new exercise{newExerciseCount === 1 ? "" : "s"}
                  </SummaryPill>
                )}
                {appendedMarkCount > 0 && (
                  <SummaryPill>
                    {appendedMarkCount} mark{appendedMarkCount === 1 ? "" : "s"} appended
                  </SummaryPill>
                )}
                {skippedEmptyExistingCount > 0 && (
                  <SummaryPill muted>
                    {skippedEmptyExistingCount} existing without new marks skipped
                  </SummaryPill>
                )}
              </div>

              {(parsed.skippedRows > 0 || parsed.ignoredBoundaryCells > 0) && (
                <p className="text-xs text-slate-400">
                  {parsed.ignoredBoundaryCells > 0
                    ? `${parsed.ignoredBoundaryCells} print-boundary “x” cell${parsed.ignoredBoundaryCells === 1 ? "" : "s"} ignored. `
                    : ""}
                  {parsed.skippedRows > 0
                    ? `${parsed.skippedRows} row${parsed.skippedRows === 1 ? "" : "s"} without an exercise name skipped.`
                    : ""}
                </p>
              )}

              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
                  <FileSpreadsheet className="h-4 w-4 text-slate-400" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Import preview</p>
                </div>
                <ol className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
                  {parsed.rows.map((row) => {
                    const existing = existingExercises.get(normalizeName(row.name))
                    const willAppend = Boolean(existing && row.marks.length > 0)
                    const willSkip = Boolean(existing && !willAppend)
                    const metricLabel = FRONTIER_METRIC_OPTIONS.find(
                      (option) => option.value === row.metric
                    )?.shortLabel
                    return (
                      <li key={`${row.sourceRow}-${row.name}`} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-800">{row.name}</p>
                            <p className="mt-0.5 truncate font-mono text-xs text-slate-500">
                              {row.marks.length > 0
                                ? row.marks.map((mark) => mark.rawValue).join("  →  ")
                                : "No mark yet"}
                            </p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${
                            willSkip
                              ? "bg-slate-100 text-slate-400"
                              : willAppend
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-indigo-50 text-indigo-700"
                          }`}>
                            {willSkip
                              ? "No marks to append"
                              : willAppend
                                ? `Append ${row.marks.length}`
                                : metricLabel}
                          </span>
                        </div>
                        {willAppend && existing && existing.metric !== row.metric && (
                          <p className="mt-1.5 flex items-center gap-1 text-[11px] text-amber-700">
                            <AlertTriangle className="h-3 w-3" />
                            Existing measure retained; pasted text will still be preserved.
                          </p>
                        )}
                        {row.warnings.map((warning) => (
                          <p key={warning} className="mt-1.5 flex items-center gap-1 text-[11px] text-amber-700">
                            <AlertTriangle className="h-3 w-3" />
                            {warning}
                          </p>
                        ))}
                      </li>
                    )
                  })}
                </ol>
              </div>

              <p className="text-xs leading-relaxed text-slate-400">
                Import is additive: existing marks stay in place and pasted marks follow them in left-to-right order.
                Original text is preserved.
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 bg-white px-5 py-4 sm:px-6">
          <Button
            size="lg"
            className="h-12 w-full bg-indigo-600 text-white hover:bg-indigo-700"
            disabled={importableRows.length === 0}
            onClick={() => onImport(parsed.rows)}
          >
            {importableRows.length > 0
              ? `Import ${importableRows.length} row${importableRows.length === 1 ? "" : "s"} · keep existing data`
              : "Nothing new to import"}
          </Button>
        </div>
      </section>
    </div>
  )
}

function normalizeName(name: string): string {
  return name.trim().toLocaleLowerCase()
}

function SummaryPill({
  children,
  muted = false,
}: {
  children: React.ReactNode
  muted?: boolean
}) {
  return (
    <span className={`rounded-full px-2.5 py-1 font-medium ${
      muted ? "bg-slate-100 text-slate-500" : "bg-indigo-50 text-indigo-700"
    }`}>
      {children}
    </span>
  )
}
