import { act, renderHook } from '@testing-library/react'
import * as audio from 'expo-audio'
import React from 'react'

import { __resetAudioSessionConfiguredForTests } from '../audio/audioSession'
import { PAUSE_AFTER_SILENCE_MS } from '../audio/useLoopingAudio'
import { useMusic } from '../audio/useMusic'
import { FeedbackPressProvider } from '../FeedbackPressProvider'
import { useMusicSettings } from '../useMusicSettings'
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
const wait = (ms: number) => act(() => jest.advanceTimersByTimeAsync(ms))
const player = (i = 0) => mockedCreateAudioPlayer.mock.results[i].value
const on = ({ children }: { children: React.ReactNode }) => <FeedbackPressProvider musicInitialValue={{ enabled: true }}>{children}</FeedbackPressProvider>

describe('useMusic', () => {
  it('loops its track, fading up to the volume', async () => {
    renderHook(() => useMusic('menu.wav', 0.4, { fadeMs: 400 }), { wrapper: on })
    await build()
    expect(player().loop).toBe(true)

    await wait(200)
    expect(player().play).toHaveBeenCalledTimes(1)
    expect(player().volume).toBeGreaterThan(0.1)
    expect(player().volume).toBeLessThan(0.35)

    await wait(250)
    expect(player().volume).toBeCloseTo(0.4)
  })

  it('stays silent while Music is off', async () => {
    const off = ({ children }: { children: React.ReactNode }) => <FeedbackPressProvider musicInitialValue={{ enabled: false }}>{children}</FeedbackPressProvider>
    renderHook(() => useMusic('menu.wav', 0.4), { wrapper: off })
    await build()
    await wait(1000)
    expect(player().play).not.toHaveBeenCalled()
  })

  it("doesn't follow the Sound setting", async () => {
    const soundOff = ({ children }: { children: React.ReactNode }) => (
      <FeedbackPressProvider soundInitialValue={{ enabled: false }} musicInitialValue={{ enabled: true }}>
        {children}
      </FeedbackPressProvider>
    )
    const { result } = renderHook(() => ({ sound: useSoundSettings(), music: useMusic('menu.wav', 0.4, { fadeMs: 0 }) }), { wrapper: soundOff })
    await build()
    expect(result.current.sound.settings.enabled).toBe(false)
    expect(player().play).toHaveBeenCalledTimes(1)
  })

  it('silences at once when Music is turned off, and pauses', async () => {
    const { result } = renderHook(
      () => {
        useMusic('battle.wav', 0.5, { fadeMs: 100 })
        return useMusicSettings()
      },
      { wrapper: on }
    )
    await build()
    await wait(200)
    expect(player().volume).toBeCloseTo(0.5)

    act(() => result.current.set({ enabled: false }))
    expect(player().volume).toBe(0)
    await wait(PAUSE_AFTER_SILENCE_MS)
    expect(player().pause).toHaveBeenCalledTimes(1)
  })

  it('crossfades two tracks as their volumes swap', async () => {
    const { rerender } = renderHook(({ inBattle }) => [useMusic('menu.wav', inBattle ? 0 : 0.4, { fadeMs: 400 }), useMusic('battle.wav', inBattle ? 0.4 : 0, { fadeMs: 400 })], { wrapper: on, initialProps: { inBattle: false } })
    await build()
    await wait(500)
    const [menu, battle] = [player(0), player(1)]
    expect(menu.volume).toBeCloseTo(0.4)
    expect(battle.play).not.toHaveBeenCalled()

    rerender({ inBattle: true })
    await wait(200)
    expect(menu.volume).toBeGreaterThan(0.05)
    expect(menu.volume).toBeLessThan(0.35)
    expect(battle.volume).toBeGreaterThan(0.05)

    await wait(250 + PAUSE_AFTER_SILENCE_MS)
    expect(battle.volume).toBeCloseTo(0.4)
    expect(menu.pause).toHaveBeenCalledTimes(1)
  })
})
