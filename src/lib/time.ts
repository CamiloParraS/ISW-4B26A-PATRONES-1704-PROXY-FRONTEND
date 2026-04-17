export function getNextMinuteBoundaryEpochMs(now = new Date()) {
  const next = new Date(now)
  next.setSeconds(0, 0)
  next.setMinutes(next.getMinutes() + 1)
  return next.getTime()
}

export function formatCountdown(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds)
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

export function getRemainingSeconds(targetEpochMs: number | null) {
  if (!targetEpochMs) {
    return 0
  }

  const delta = targetEpochMs - Date.now()
  if (delta <= 0) {
    return 0
  }

  return Math.ceil(delta / 1000)
}
