'use client'

/**
 * components/recipe/CountdownTimer.js
 *
 * Standalone countdown timer for a single recipe preparation step.
 *
 * Features:
 *   - Start / Pause toggle
 *   - Reset to original duration
 *   - Visual progress bar
 *   - Color-coded state: idle (gray) → running (orange) → done (green)
 *   - "Done" audio cue via Web Audio API (no external assets required)
 *
 * Props:
 *   @param {number} minutes  — base_duration_minutes from the DB (must be > 0)
 *   @param {number} stepNo   — Used to generate unique element IDs for accessibility
 *
 * Timer Logic:
 *   totalSeconds = minutes × 60
 *   Each tick decrements secondsLeft by 1 via setInterval.
 *   When secondsLeft reaches 0, the interval clears and isDone = true.
 *   Reset restores secondsLeft to totalSeconds and pauses the timer.
 */

import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Audio cue (no file dependency) ─────────────────────────────────────────
// Plays a brief double-beep when the timer reaches zero using the Web Audio API.
function playDoneSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    ;[0, 0.25].forEach((delay) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.3, ctx.currentTime + delay)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.2)
      osc.start(ctx.currentTime + delay)
      osc.stop(ctx.currentTime + delay + 0.2)
    })
  } catch {
    // AudioContext not available (SSR guard, some browsers in silent mode)
  }
}

// ─── Time formatter ──────────────────────────────────────────────────────────
function formatTime(seconds) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

export default function CountdownTimer({ minutes, stepNo }) {
  const totalSeconds = minutes * 60

  const [secondsLeft, setSecondsLeft] = useState(totalSeconds)
  const [isRunning, setIsRunning]     = useState(false)
  const intervalRef                   = useRef(null)
  const hasFiredRef                   = useRef(false) // prevent double-beep on re-render

  // ── Tick logic ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current)
            setIsRunning(false)
            if (!hasFiredRef.current) {
              hasFiredRef.current = true
              playDoneSound()
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }

    // Cleanup on unmount or when isRunning toggles
    return () => clearInterval(intervalRef.current)
  }, [isRunning])

  // ── Reset ────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    clearInterval(intervalRef.current)
    setIsRunning(false)
    setSecondsLeft(totalSeconds)
    hasFiredRef.current = false
  }, [totalSeconds])

  // ── Derived state ────────────────────────────────────────────────────────
  const isDone      = secondsLeft === 0
  const progress    = Math.round(((totalSeconds - secondsLeft) / totalSeconds) * 100)
  const timerLabel  = isDone ? 'Complete!' : formatTime(secondsLeft)

  // ── Colour tokens by state ────────────────────────────────────────────────
  const stateClass = isDone
    ? 'text-green-600'
    : isRunning
    ? 'text-orange-500'
    : 'text-gray-500'

  const barClass = isDone
    ? 'bg-green-400'
    : isRunning
    ? 'bg-orange-400'
    : 'bg-gray-300'

  const startBtnId = `timer-start-step-${stepNo}`
  const resetBtnId = `timer-reset-step-${stepNo}`

  return (
    <div
      className="mt-4 rounded-xl bg-amber-50 border border-amber-100 p-3 space-y-2"
      role="timer"
      aria-label={`Step ${stepNo} timer: ${timerLabel}`}
    >
      {/* ── Row 1: time display + controls ──────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">

        {/* Time display */}
        <span
          className={`font-mono text-2xl font-bold tabular-nums tracking-tight ${stateClass} transition-colors`}
        >
          {isDone ? '✅ Done!' : timerLabel}
        </span>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {!isDone && (
            <button
              id={startBtnId}
              onClick={() => setIsRunning((r) => !r)}
              aria-label={isRunning ? 'Pause timer' : 'Start timer'}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                isRunning
                  ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {isRunning ? '⏸ Pause' : '▶ Start'}
            </button>
          )}

          <button
            id={resetBtnId}
            onClick={reset}
            aria-label="Reset timer"
            className="px-3 py-1.5 rounded-full text-xs font-semibold
                       bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            ↺ Reset
          </button>
        </div>

        {/* Duration label */}
        <span className="text-xs text-gray-400 flex-shrink-0">
          {minutes} min
        </span>
      </div>

      {/* ── Row 2: Progress bar ──────────────────────────────────────────── */}
      <div
        className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Timer progress"
      >
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear ${barClass}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
