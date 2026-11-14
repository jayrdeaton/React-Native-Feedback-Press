import { act, renderHook } from '@testing-library/react'
import * as audio from 'expo-audio'

import { __resetAudioSessionConfiguredForTests } from '../audio/audioSession'
import { LEVEL_MIN_INTERVAL_MS, PAUSE_AFTER_SILENCE_MS, useLoopingAudio } from '../audio/useLoopingAudio'

const mockedCreateAudioPlayer = audio.createAudioPlayer as jest.Mock
const mockedSetAudioModeAsync = audio.setAudioModeAsync as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  jest.useFakeTimers()
  __resetAudioSessionConfiguredForTests()
})

afterEach(() => {
  jest.useRealTimers()
})

// Runs the deferred player creation (a 0 ms timer, then the awaited audio session) without
// running a pending pause.
const build = () => act(() => jest.advanceTimersByTimeAsync(0))
const advance = (ms: number) => act(() => jest.advanceTimersByTimeAsync(ms))

function mount() {
  const hook = renderHook(() => useLoopingAudio('roll.wav'))
  return { ...hook, player: () => mockedCreateAudioPlayer.mock.results[0].value }
}

describe('useLoopingAudio', () => {
  it('builds one looping player a tick after mount, silent and paused, its pitch moving with its rate', async () => {
    const { player } = mount()
    expect(mockedCreateAudioPlayer).not.toHaveBeenCalled()

    await build()

    expect(mockedCreateAudioPlayer).toHaveBeenCalledTimes(1)
    expect(mockedCreateAudioPlayer).toHaveBeenCalledWith('roll.wav', { keepAudioSessionActive: true })
    expect(player().loop).toBe(true)
    expect(player().shouldCorrectPitch).toBe(false)
    expect(player().play).not.toHaveBeenCalled()
    expect(mockedSetAudioModeAsync).toHaveBeenCalledTimes(1)
  })

  it('plays at the level it is given', async () => {
    const { result, player } = mount()
    await build()

    act(() => result.current.setLevel(0.5, 1.2))

    expect(player().volume).toBe(0.5)
    expect(player().setPlaybackRate).toHaveBeenCalledWith(1.2)
    expect(player().play).toHaveBeenCalledTimes(1)
  })

  it('writes a changing level at most every LEVEL_MIN_INTERVAL_MS, however often it is set', async () => {
    const { result, player } = mount()
    await build()
    act(() => result.current.setLevel(0.5))

    act(() => {
      for (let i = 1; i <= 5; i++) result.current.setLevel(0.5 + i * 0.05)
    })
    expect(player().volume).toBe(0.5)

    await advance(LEVEL_MIN_INTERVAL_MS)
    act(() => result.current.setLevel(0.8))
    expect(player().volume).toBe(0.8)
    expect(player().play).toHaveBeenCalledTimes(1)
  })

  it('skips a change too small to hear', async () => {
    const { result, player } = mount()
    await build()
    act(() => result.current.setLevel(0.5, 1))
    await advance(LEVEL_MIN_INTERVAL_MS)

    act(() => result.current.setLevel(0.505, 1.005))

    expect(player().volume).toBe(0.5)
    expect(player().setPlaybackRate).not.toHaveBeenCalled()
  })

  it('silences at once on 0 and pauses PAUSE_AFTER_SILENCE_MS later', async () => {
    const { result, player } = mount()
    await build()
    act(() => result.current.setLevel(0.5))

    act(() => result.current.setLevel(0))
    expect(player().volume).toBe(0)
    expect(player().pause).not.toHaveBeenCalled()

    await advance(PAUSE_AFTER_SILENCE_MS)
    expect(player().pause).toHaveBeenCalledTimes(1)

    // Back from paused: plays again.
    act(() => result.current.setLevel(0.3))
    expect(player().volume).toBe(0.3)
    expect(player().play).toHaveBeenCalledTimes(2)
  })

  it('a level that dips to 0 and straight back only touches the volume, never pause() and play()', async () => {
    const { result, player } = mount()
    await build()
    act(() => result.current.setLevel(0.5))

    act(() => {
      result.current.setLevel(0)
      result.current.setLevel(0.4) // inside the write interval, but the first sound back is never held back
    })
    await advance(PAUSE_AFTER_SILENCE_MS)

    expect(player().volume).toBe(0.4)
    expect(player().pause).not.toHaveBeenCalled()
    expect(player().play).toHaveBeenCalledTimes(1)
  })

  it('applies a level set before the player exists as soon as it is built', async () => {
    const { result, player } = mount()

    act(() => result.current.setLevel(0.6, 1.4))
    await build()

    expect(player().volume).toBe(0.6)
    expect(player().setPlaybackRate).toHaveBeenCalledWith(1.4)
    expect(player().play).toHaveBeenCalledTimes(1)
  })

  it('treats a volume that is not a number as silence, and clamps the rest', async () => {
    const { result, player } = mount()
    await build()

    act(() => result.current.setLevel(Number.NaN))
    expect(player().play).not.toHaveBeenCalled()

    act(() => result.current.setLevel(4, 9))
    expect(player().volume).toBeUndefined() // 4 clamps to 1, which a new player already has
    expect(player().setPlaybackRate).toHaveBeenCalledWith(2)
  })

  it('removes the player on unmount and never pauses it afterward', async () => {
    const { result, player, unmount } = mount()
    await build()
    act(() => result.current.setLevel(0.5))
    act(() => result.current.setLevel(0))

    unmount()
    await advance(PAUSE_AFTER_SILENCE_MS)

    expect(player().remove).toHaveBeenCalledTimes(1)
    expect(player().pause).not.toHaveBeenCalled()
  })

  it('never builds a player if unmounted before the deferred creation', async () => {
    const { unmount } = mount()
    unmount()
    await advance(0)

    expect(mockedCreateAudioPlayer).not.toHaveBeenCalled()
  })

  it('leaves the audio session alone when configureAudioSession is false', async () => {
    renderHook(() => useLoopingAudio('roll.wav', { configureAudioSession: false }))
    await build()

    expect(mockedSetAudioModeAsync).not.toHaveBeenCalled()
    expect(mockedCreateAudioPlayer).toHaveBeenCalledTimes(1)
  })

  it('keeps the same setLevel across renders', async () => {
    const { result, rerender } = mount()
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })
})
