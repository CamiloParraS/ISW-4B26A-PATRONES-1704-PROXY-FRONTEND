import { useEffect, useState } from "react"

import { getRemainingSeconds } from "@/lib/time"

export function useCountdown(targetEpochMs: number | null) {
  const [, forceTick] = useState(0)

  useEffect(() => {
    if (!targetEpochMs) {
      return undefined
    }

    const timerId = window.setInterval(() => {
      forceTick((current) => current + 1)
    }, 1000)

    return () => {
      window.clearInterval(timerId)
    }
  }, [targetEpochMs])

  return getRemainingSeconds(targetEpochMs)
}
