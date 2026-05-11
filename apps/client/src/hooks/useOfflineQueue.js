import { useEffect, useCallback } from 'react'
import { postWorkout } from '../api/client'

const QUEUE_KEY = 'gym_offline_queue'

export function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
  } catch {
    return []
  }
}

export function enqueueWorkout(payload) {
  const queue = getQueue()
  queue.push({ payload, queuedAt: new Date().toISOString() })
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

async function flushQueue() {
  const queue = getQueue()
  if (!queue.length) return
  const failed = []
  for (const item of queue) {
    try {
      await postWorkout(item.payload)
    } catch {
      failed.push(item)
    }
  }
  localStorage.setItem(QUEUE_KEY, JSON.stringify(failed))
}

/** Mounts a window.online listener that flushes queued workouts on reconnect. */
export function useOfflineQueueFlusher() {
  const flush = useCallback(() => {
    if (navigator.onLine) flushQueue()
  }, [])

  useEffect(() => {
    window.addEventListener('online', flush)
    // Flush immediately on mount in case we came back online while the page was closed
    flush()
    return () => window.removeEventListener('online', flush)
  }, [flush])
}
