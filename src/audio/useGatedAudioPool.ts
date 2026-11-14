import { AudioSource } from 'expo-audio'
import { useCallback } from 'react'

import { useSoundSettings } from '../useSoundSettings'
import type { PlayAudio } from './audioLevel'
import { type AudioPoolOptions, useAudioPool } from './useAudioPool'

/**
 * `useAudioPool` gated on the shared `useSoundSettings` toggle - for gameplay SFX that play
 * outside the button-press pipeline, which already gates its own `sound` callbacks on this same
 * setting internally (see `useFeedbackHandlers`' `fire`). Call once per distinct clip, same as
 * `useAudioPool` itself; each play takes the same `PlayOptions`.
 */
export function useGatedAudioPool(source: AudioSource, options?: AudioPoolOptions): PlayAudio {
  const { settings } = useSoundSettings()
  const play = useAudioPool(source, options)
  return useCallback<PlayAudio>(
    (playOptions) => {
      if (settings.enabled) play(playOptions)
    },
    [settings.enabled, play]
  )
}
