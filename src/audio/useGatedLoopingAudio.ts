import type { AudioSource } from 'expo-audio'
import { useCallback, useEffect, useMemo } from 'react'

import { useSoundSettings } from '../useSoundSettings'
import { type LoopingAudio, type LoopingAudioOptions, useLoopingAudio } from './useLoopingAudio'

/**
 * `useLoopingAudio` gated on the shared `useSoundSettings` toggle, as `useGatedAudioPool` gates
 * `useAudioPool`: every level is silence while sound is off, and turning sound off silences a loop
 * that is already playing, even if its caller has stopped setting levels (a paused game whose
 * settings are open).
 */
export function useGatedLoopingAudio(source: AudioSource, options?: LoopingAudioOptions): LoopingAudio {
  const { settings } = useSoundSettings()
  const enabled = settings.enabled
  const loop = useLoopingAudio(source, options)

  useEffect(() => {
    if (!enabled) loop.setLevel(0)
  }, [enabled, loop])

  const setLevel = useCallback((volume: number, rate?: number) => loop.setLevel(enabled ? volume : 0, rate), [enabled, loop])
  return useMemo(() => ({ setLevel }), [setLevel])
}
