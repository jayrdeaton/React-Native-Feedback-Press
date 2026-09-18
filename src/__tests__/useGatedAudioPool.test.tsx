import { act, renderHook } from '@testing-library/react'
import * as audio from 'expo-audio'
import React from 'react'

import { __resetAudioSessionConfiguredForTests } from '../audio/useAudioPool'
import { useGatedAudioPool } from '../audio/useGatedAudioPool'
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

const flush = () => act(() => jest.runAllTimersAsync())

// Same trick as useAudioPool.test.ts: the Nth mock result is the exact player instance the pool's
// Nth createAudioPlayer(source) call created.
const playersFor = () => mockedCreateAudioPlayer.mock.results.map((r) => r.value)

describe('useGatedAudioPool', () => {
  it('plays when sound is enabled (the default)', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <FeedbackPressProvider>{children}</FeedbackPressProvider>
    const { result } = renderHook(() => useGatedAudioPool('sound.wav'), { wrapper })
    await flush()

    act(() => result.current())
    await flush()

    expect(playersFor()[0].play).toHaveBeenCalledTimes(1)
  })

  it('does not play when sound is disabled', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <FeedbackPressProvider soundInitialValue={{ enabled: false }}>{children}</FeedbackPressProvider>
    const { result } = renderHook(() => useGatedAudioPool('sound.wav'), { wrapper })
    await flush()

    act(() => result.current())
    await flush()

    expect(playersFor()[0].play).not.toHaveBeenCalled()
  })

  it('still builds the underlying pool while sound starts disabled, so enabling it later plays immediately', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <FeedbackPressProvider soundInitialValue={{ enabled: false }}>{children}</FeedbackPressProvider>
    renderHook(() => useGatedAudioPool('sound.wav', { poolSize: 2 }), { wrapper })
    await flush()

    expect(mockedCreateAudioPlayer).toHaveBeenCalledTimes(2)
  })

  it('reacts to a live settings change without rebuilding the pool', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <FeedbackPressProvider>{children}</FeedbackPressProvider>
    const { result } = renderHook(() => ({ play: useGatedAudioPool('sound.wav'), sound: useSoundSettings() }), { wrapper })
    await flush()
    expect(mockedCreateAudioPlayer).toHaveBeenCalledTimes(4)

    act(() => result.current.sound.set({ enabled: false }))
    act(() => result.current.play())
    await flush()

    expect(playersFor()[0].play).not.toHaveBeenCalled()
    expect(mockedCreateAudioPlayer).toHaveBeenCalledTimes(4)
  })
})
