"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Activity, X, Timer, Dumbbell, Clock, Zap, BookOpen, Gauge } from "lucide-react"
import {
  CircuitWorkoutSession,
  FreeformWorkoutSession,
  IntervalWorkoutSession,
  LissCoreWorkoutSession,
  SitWorkoutSession,
  Vo2MaxWorkoutSession,
  WorkoutHistoryEntry,
  WorkoutSession,
} from "@/types/workout"
import { formatCableSetup, formatCardioSelection } from "@/data/liss-core"
import { circuitWorkouts } from "@/data/circuit-workouts"
import { formatDisplayDate } from "./calendar-utils"
import { useDialogFocus } from "@/hooks/use-dialog-focus"

interface WorkoutDetailModalProps {
  date: Date
  workouts: WorkoutHistoryEntry[]
  onClose: () => void
}

function FreeformDataView({ session }: { session: FreeformWorkoutSession }) {
  return (
    <div className="space-y-3">
      {session.exercises.map((exercise, i) => (
        <div key={i} className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{exercise.name}</span>
            {exercise.tags?.map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px] capitalize">{tag}</Badge>
            ))}
          </div>
          {exercise.sets?.length > 0 && (
            <div className="pl-2 space-y-0.5">
              {exercise.sets.map((set) => (
                <p key={set.id} className="text-xs text-muted-foreground font-mono">
                  Set {set.id}
                  {set.weight && ` — ${set.weight} lbs`}
                  {set.reps && ` x ${set.reps}`}
                </p>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.round(seconds))
  const minutes = Math.floor(safeSeconds / 60)
  const remainingSeconds = safeSeconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

function formatPace(secondsPerMile: number): string {
  if (!Number.isFinite(secondsPerMile) || secondsPerMile <= 0) return "--"
  const roundedSeconds = Math.round(secondsPerMile)
  const minutes = Math.floor(roundedSeconds / 60)
  const seconds = roundedSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}/mi`
}

function CircuitDataView({ session }: { session: CircuitWorkoutSession }) {
  const comboResults = session.rounds.flatMap((round) => round.comboResults)
  const completedCombos = comboResults.filter((result) => result.completedWithoutStopping).length
  const totalTimeSeconds = session.rounds.reduce((total, round) => total + round.totalTimeSeconds, 0)
  const equipment = Object.entries(session.exerciseEquipment ?? {})
  const exerciseNames = new Map(
    (circuitWorkouts[session.variant]?.combos ?? []).flatMap((combo) => combo.subExercises).map((exercise) => {
      const choice = session.exerciseChoices?.[exercise.id]
      return [exercise.id, choice === "alternative" && exercise.alternative ? exercise.alternative.name : exercise.name] as const
    })
  )

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Rounds</p>
          <p className="mt-1 text-xl font-bold text-foreground">{session.rounds.length}</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Total time</p>
          <p className="mt-1 font-mono text-xl font-bold text-foreground">{formatDuration(totalTimeSeconds)}</p>
        </div>
        <div className="col-span-2 rounded-lg bg-muted/50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Completed without stopping</p>
          <p className="mt-1 text-sm font-bold text-foreground">{completedCombos} of {comboResults.length} combos</p>
        </div>
      </div>

      <div className="space-y-2">
        {session.rounds.map((round) => {
          const completed = round.comboResults.filter((result) => result.completedWithoutStopping).length
          return (
            <div key={round.round} className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <span className="font-semibold text-foreground">Round {round.round}</span>
              <span className="text-muted-foreground">{completed}/{round.comboResults.length} combos · {formatDuration(round.totalTimeSeconds)}</span>
            </div>
          )
        })}
      </div>

      {equipment.length > 0 && (
        <div className="rounded-lg border p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Equipment</p>
          <div className="mt-2 space-y-1 text-xs text-foreground">
            {equipment.map(([exerciseId, value]) => <p key={exerciseId}>{exerciseNames.get(exerciseId) ?? exerciseId}: {value}</p>)}
          </div>
        </div>
      )}

      {session.weakLinkPractice && session.weakLinkPractice.length > 0 && (
        <div className="rounded-lg border p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Weak-link practice</p>
          <div className="mt-2 space-y-1 text-xs text-foreground">
            {session.weakLinkPractice.map((practice) => (
              <p key={`${practice.exerciseId}-${practice.practicedAt}`}>{practice.exerciseName}: {formatDuration(practice.practiceTimeSeconds)}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function IntervalDataView({ session }: { session: IntervalWorkoutSession }) {
  const notes = Object.entries(session.setNotes ?? {}).sort(([a], [b]) => Number(a) - Number(b))
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Sets</p>
          <p className="mt-1 text-xl font-bold text-red-600">{session.completedSets}/{session.totalSets}</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Total time</p>
          <p className="mt-1 font-mono text-xl font-bold text-foreground">{formatDuration(session.totalTimeSeconds)}</p>
        </div>
      </div>
      {notes.length > 0 && (
        <div className="rounded-lg border p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Set performance</p>
          <div className="mt-2 space-y-1 text-sm text-foreground">
            {notes.map(([setNumber, note]) => <p key={setNumber}><span className="font-semibold">Set {setNumber}:</span> {note}</p>)}
          </div>
        </div>
      )}
      {session.endedEarly && <p className="text-xs font-medium text-amber-600">Workout ended early</p>}
    </div>
  )
}

function SitDataView({ session }: { session: SitWorkoutSession }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Sprints</p>
          <p className="mt-1 text-xl font-bold text-green-600">{session.sprintTimes.length}</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Best sprint</p>
          <p className="mt-1 font-mono text-xl font-bold text-foreground">
            {session.bestSprintTimeSeconds === null ? "--" : `${session.bestSprintTimeSeconds.toFixed(1)}s`}
          </p>
        </div>
        <div className="col-span-2 rounded-lg bg-muted/50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Workout</p>
          <p className="mt-1 text-sm font-bold text-foreground">{formatDuration(session.totalTimeSeconds)} · {session.phasesCompleted}/4 phases</p>
        </div>
      </div>
      {session.sprintTimes.length > 0 && (
        <div className="rounded-lg border p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Sprint times</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {session.sprintTimes.map((sprint) => (
              <Badge key={sprint.sprintNumber} variant="outline">Sprint {sprint.sprintNumber}: {sprint.timeSeconds.toFixed(1)}s</Badge>
            ))}
          </div>
        </div>
      )}
      {session.endedEarly && <p className="text-xs font-medium text-amber-600">Workout ended early</p>}
    </div>
  )
}

function Vo2MaxDataView({ session }: { session: Vo2MaxWorkoutSession }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Relative VO2 Max</p>
          <p className="mt-1 text-xl font-bold text-cyan-600">{session.vo2Max.toFixed(1)}</p>
          <p className="text-xs text-muted-foreground">mL/kg/min</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">METs</p>
          <p className="mt-1 text-xl font-bold text-foreground">{session.mets.toFixed(1)}</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Test Distance</p>
          <p className="mt-1 text-sm font-mono font-bold text-foreground">
            {session.testDistanceMiles.toFixed(2)} mi
          </p>
          <p className="text-xs text-muted-foreground">{Math.round(session.testDistanceMeters)} m</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Speed</p>
          <p className="mt-1 text-sm font-mono font-bold text-foreground">
            {session.averageSpeedMph.toFixed(1)} mph
          </p>
          <p className="text-xs text-muted-foreground">{formatPace(session.averagePaceSecondsPerMile)}</p>
        </div>
      </div>

      <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">
          Body-mass scaled oxygen uptake per kilogram per minute.
        </p>
        <p>
          Final {session.finalDistanceMiles.toFixed(2)} mi - start offset {session.startOffsetMiles.toFixed(2)} mi
        </p>
        <p>Duration {formatDuration(session.durationSeconds)} at {session.inclinePercent}% incline</p>
        {session.endedEarly && <p className="font-medium text-amber-600">Marked finished early</p>}
        {session.notes && <p className="pt-1 text-foreground">{session.notes}</p>}
      </div>
    </div>
  )
}

function LissCoreDataView({ session }: { session: LissCoreWorkoutSession }) {
  const extensionSetup = session.cableSetup.backExtension ?? session.cableSetup.antiFlexion ?? {}
  const extensionLabel = session.cableSetup.backExtension ? "Back extension" : "Anti-flexion"
  const setupRows = session.cableSetup.useSideSpecificRotation
    ? [
        ["Rotation — left", session.cableSetup.rotationLeft ?? session.cableSetup.rotation],
        ["Rotation — right", session.cableSetup.rotationRight ?? session.cableSetup.rotation],
        ["Crunch", session.cableSetup.crunch],
        [extensionLabel, extensionSetup],
      ] as const
    : [
        ["Rotation", session.cableSetup.rotation],
        ["Crunch", session.cableSetup.crunch],
        [extensionLabel, extensionSetup],
      ] as const
  const ratingLabels = {
    "too-easy": "Too Easy",
    "about-right": "About Right",
    "too-hard": "Too Hard",
  } as const
  const exerciseLabels: Record<string, string> = {
    rotation: "Rotation",
    crunch: "Crunch",
    "back-extension": "Back extension",
    "anti-flexion": "Anti-flexion",
    overall: "Overall",
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Total</p>
          <p className="mt-1 font-mono text-lg font-bold">{formatDuration(session.totalTimeSeconds)}</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Intervals</p>
          <p className="mt-1 text-sm font-bold">{session.completedIntervals} completed</p>
          <p className="text-xs text-muted-foreground">{session.skippedIntervals} skipped</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Cardio</p>
          <p className="mt-1 font-mono text-sm font-bold">{formatDuration(session.cardioSeconds ?? session.lissSeconds ?? 0)}</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Core endurance</p>
          <p className="mt-1 font-mono text-sm font-bold">{formatDuration(session.abdominalSeconds)} abdominal</p>
          <p className="text-xs text-muted-foreground">{formatDuration(session.extensorSeconds)} extensor</p>
        </div>
      </div>

      {session.cardioSelections && Object.keys(session.cardioSelections).length > 0 && (
        <div className="rounded-lg border p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Cardio modalities</p>
          <div className="mt-2 space-y-1 text-xs text-foreground">
            {Object.entries(session.cardioSelections).map(([id, selection], index) => (
              <p key={id}>Cardio {index + 1}: {formatCardioSelection(selection) ?? "Not recorded"}</p>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {setupRows.map(([label, setup]) => (
          <div key={label} className="rounded-lg border p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1 text-sm text-foreground">{formatCableSetup(setup) ?? "Not recorded"}</p>
            {setup.setupNote && <p className="mt-1 text-xs text-muted-foreground">{setup.setupNote}</p>}
          </div>
        ))}
      </div>

      {session.difficultyRatings && Object.keys(session.difficultyRatings).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(session.difficultyRatings).map(([exercise, rating]) => (
            rating ? <Badge key={exercise} variant="outline" className="text-[10px]">{exerciseLabels[exercise] ?? exercise}: {ratingLabels[rating]}</Badge> : null
          ))}
        </div>
      )}
      {session.endedEarly && <p className="text-xs font-medium text-amber-600">Workout ended early</p>}
      {session.notes && <p className="rounded-lg bg-muted/50 p-3 text-sm text-foreground">{session.notes}</p>}
    </div>
  )
}

function WorkoutDataView({ session }: { session: WorkoutSession }) {
  if (session.mode === "circuit") {
    return <CircuitDataView session={session} />
  }
  if (session.mode === "interval") {
    return <IntervalDataView session={session} />
  }
  if (session.mode === "sit") {
    return <SitDataView session={session} />
  }
  if (session.mode === "freeform" || (session.mode as string) === "traditional") {
    const freeformSession = session as FreeformWorkoutSession
    if (freeformSession.exercises) {
      return <FreeformDataView session={freeformSession} />
    }
  }
  if (session.mode === "vo2max") {
    return <Vo2MaxDataView session={session} />
  }
  if (session.mode === "liss-core") {
    return <LissCoreDataView session={session} />
  }
  return (
    <div className="space-y-3">
      <pre className="rounded-lg bg-muted/50 p-3 text-xs font-mono text-foreground overflow-x-auto whitespace-pre-wrap break-all">
        {JSON.stringify(session, null, 2)}
      </pre>
    </div>
  )
}

export function WorkoutDetailModal({ date, workouts, onClose }: WorkoutDetailModalProps) {
  const dialogRef = useDialogFocus<HTMLDivElement>(true, onClose)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <button type="button" className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-label="Close workout details" />
      <Card
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="workout-detail-title"
        tabIndex={-1}
        className="relative z-10 w-full max-w-md mx-4 mb-4 sm:mb-0 border-border bg-card max-h-[80vh] overflow-hidden flex flex-col"
      >
        <CardHeader className="pb-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="workout-detail-title" className="text-lg font-semibold text-foreground">{formatDisplayDate(date)}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {workouts.length} workout{workouts.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close workout details">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 overflow-y-auto flex-1">
          {workouts.map((entry) => (
            <div key={entry.id} className="space-y-3">
              <div className="flex items-center gap-2">
                {entry.session.mode === "circuit" ? (
                  <Timer className="h-4 w-4 text-primary" />
                ) : entry.session.mode === "interval" ? (
                  <Timer className="h-4 w-4 text-red-500" />
                ) : entry.session.mode === "sit" ? (
                  <Zap className="h-4 w-4 text-green-500" />
                ) : entry.session.mode === "liss-core" ? (
                  <Activity className="h-4 w-4 text-violet-500" />
                ) : entry.session.mode === "vo2max" ? (
                  <Gauge className="h-4 w-4 text-cyan-500" />
                ) : entry.session.mode === "coached" ? (
                  <BookOpen className="h-4 w-4 text-purple-500" />
                ) : (
                  <Dumbbell className="h-4 w-4 text-blue-500" />
                )}
                <Badge variant="outline">
                  {entry.session.mode === "circuit"
                    ? `Jeff Cavaliere's Bodyweight Circuit ${entry.session.variant}`
                    : entry.session.mode === "interval"
                    ? "4x4 Interval"
                    : entry.session.mode === "sit"
                    ? "SIT Sprint"
                    : entry.session.mode === "liss-core"
                    ? "LISS + Core Endurance"
                    : entry.session.mode === "vo2max"
                    ? "VO2 Max"
                    : entry.session.mode === "coached"
                    ? `Archived program: ${entry.session.workoutName}`
                    : "Freeform"}
                </Badge>
                <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(entry.completedAt).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <WorkoutDataView session={entry.session} />

              {workouts.indexOf(entry) < workouts.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
