import { act, renderHook } from '@testing-library/react'
import * as audio from 'expo-audio'

import { useAudioPool } from '../audio/useAudioPool'

const mockedCreateAudioPlayer = audio.createAudioPlayer as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

const flush = () => act(() => jest.runAllTimersAsync())

// createAudioPlayer's own mock factory returns a fresh { play, seekTo, remove } object per call,
// so the Nth entry here is the exact player instance the pool's Nth createAudioPlayer(source)
// call created.
const playersFor = () => mockedCreateAudioPlayer.mock.results.map((r) => r.value)

describe('useAudioPool', () => {
  it('allocates exactly poolSize players, not a fixed maximum', async () => {
    renderHook(() => useAudioPool('sound.wav', { poolSize: 2 }))
    await flush()
    expect(mockedCreateAudioPlayer).toHaveBeenCalledTimes(2)
  })

  it('allocates the default pool of 4 when poolSize is omitted', async () => {
    renderHook(() => useAudioPool('sound.wav'))
    await flush()
    expect(mockedCreateAudioPlayer).toHaveBeenCalledTimes(4)
  })

  it('passes the same source to every pooled player', async () => {
    const source = 'my-clip.wav'
    renderHook(() => useAudioPool(source, { poolSize: 3 }))
    await flush()
    mockedCreateAudioPlayer.mock.calls.forEach((call) => expect(call[0]).toBe(source))
  })

  it('clamps a poolSize below 1 up to 1', async () => {
    renderHook(() => useAudioPool('sound.wav', { poolSize: 0 }))
    await flush()
    expect(mockedCreateAudioPlayer).toHaveBeenCalledTimes(1)
  })

  it('clamps a poolSize above the max down to 16', async () => {
    renderHook(() => useAudioPool('sound.wav', { poolSize: 100 }))
    await flush()
    expect(mockedCreateAudioPlayer).toHaveBeenCalledTimes(16)
  })

  it('does not allocate any player synchronously on mount', () => {
    renderHook(() => useAudioPool('sound.wav', { poolSize: 4 }))
    expect(mockedCreateAudioPlayer).not.toHaveBeenCalled()
  })

  it('round-robins across the requested pool', async () => {
    const { result } = renderHook(() => useAudioPool('sound.wav', { poolSize: 4 }))
    await flush()
    const players = playersFor()

    act(() => {
      for (let i = 0; i < 5; i++) result.current()
    })
    await flush()

    expect(players[0].play).toHaveBeenCalledTimes(2)
    expect(players[1].play).toHaveBeenCalledTimes(1)
    expect(players[2].play).toHaveBeenCalledTimes(1)
    expect(players[3].play).toHaveBeenCalledTimes(1)
  })

  it('seeks to 0 before playing, so a retriggered clip restarts instead of resuming', async () => {
    const { result } = renderHook(() => useAudioPool('sound.wav'))
    await flush()
    const players = playersFor()

    act(() => result.current())
    await flush()

    expect(players[0].seekTo).toHaveBeenCalledWith(0)
    expect(players[0].play).toHaveBeenCalledTimes(1)
  })

  it('overlapping presses land on different players instead of racing the same one', async () => {
    // The bug useAudioPool exists to fix: two presses close together must never touch the same
    // player, or the second press's seekTo(0) can abort the first press's still-in-flight play().
    const { result } = renderHook(() => useAudioPool('sound.wav'))
    await flush()
    const players = playersFor()

    act(() => {
      result.current()
      result.current()
    })
    await flush()

    expect(players[0].play).toHaveBeenCalledTimes(1)
    expect(players[1].play).toHaveBeenCalledTimes(1)
  })

  it('removes every pooled player on unmount', async () => {
    const { unmount } = renderHook(() => useAudioPool('sound.wav', { poolSize: 3 }))
    await flush()
    const players = playersFor()

    unmount()

    players.forEach((player) => expect(player.remove).toHaveBeenCalledTimes(1))
  })

  it('cancels pending pool creation if unmounted before the deferred timer fires', () => {
    const { unmount } = renderHook(() => useAudioPool('sound.wav', { poolSize: 3 }))

    unmount()
    jest.runAllTimers()

    expect(mockedCreateAudioPlayer).not.toHaveBeenCalled()
  })

  it('tears down the old pool and builds a fresh one when poolSize changes', async () => {
    const { rerender } = renderHook(({ poolSize }) => useAudioPool('sound.wav', { poolSize }), { initialProps: { poolSize: 2 } })
    await flush()
    const firstPoolPlayers = playersFor()
    expect(mockedCreateAudioPlayer).toHaveBeenCalledTimes(2)

    rerender({ poolSize: 5 })
    await flush()

    firstPoolPlayers.forEach((player) => expect(player.remove).toHaveBeenCalledTimes(1))
    expect(mockedCreateAudioPlayer).toHaveBeenCalledTimes(2 + 5)
  })
})
