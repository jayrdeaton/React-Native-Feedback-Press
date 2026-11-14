import { act, renderHook } from '@testing-library/react'
import * as audio from 'expo-audio'
import React from 'react'

import { __resetAudioSessionConfiguredForTests } from '../audio/audioSession'
import { useGatedLoopingAudio } from '../audio/useGatedLoopingAudio'
import { PAUSE_AFTER_SILENCE_MS } from '../audio/useLoopingAudio'
import { FeedbackPressProvider } from '../FeedbackPressProvider'
import { useSoundSettings } from '../useSoundSettings'

const mockedCreateAudioPlayer = audio.createAudioPlayer as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  jest.useFakeTimers()
  __resetAudioSessionConfiguredForTests()
})

afterEach(() => {
  jest.useRealTimers()
})

const build = () => act(() => jest.advanceTimersByTimeAsync(0))
const player = () => mockedCreateAudioPlayer.mock.results[0].value

describe('useGatedLoopingAudio', () => {
  it('plays while sound is on', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <FeedbackPressProvider>{children}</FeedbackPressProvider>
    const { result } = renderHook(() => useGatedLoopingAudio('roll.wav'), { wrapper })
    await build()

    act(() => result.current.setLevel(0.5))

    expect(player().play).toHaveBeenCalledTimes(1)
  })

  it('stays silent while sound is off', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <FeedbackPressProvider soundInitialValue={{ enabled: false }}>{children}</FeedbackPressProvider>
    const { result } = renderHook(() => useGatedLoopingAudio('roll.wav'), { wrapper })
    await build()

    act(() => result.current.setLevel(0.5))

    expect(player().play).not.toHaveBeenCalled()
  })

  it('silences a playing loop when sound turns off, with no further level from its caller', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <FeedbackPressProvider>{children}</FeedbackPressProvider>
    const { result } = renderHook(() => ({ loop: useGatedLoopingAudio('roll.wav'), sound: useSoundSettings() }), { wrapper })
    await build()
    act(() => result.current.loop.setLevel(0.5))

    act(() => result.current.sound.set({ enabled: false }))
    expect(player().volume).toBe(0)

    await act(() => jest.advanceTimersByTimeAsync(PAUSE_AFTER_SILENCE_MS))
    expect(player().pause).toHaveBeenCalledTimes(1)
  })
})
