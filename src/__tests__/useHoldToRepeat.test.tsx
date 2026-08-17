import { act, renderHook } from '@testing-library/react'
import * as haptics from 'expo-haptics'
import React from 'react'

import { FeedbackPressProvider } from '../FeedbackPressProvider'
import type { HoldToRepeatOptions } from '../useHoldToRepeat'
import { useHoldToRepeat, useHoldToRepeatByKey } from '../useHoldToRepeat'

const mockedHaptics = haptics as jest.Mocked<typeof haptics>

const REPEAT_MS = 400

const wrapper = ({ children }: { children: React.ReactNode }) => <FeedbackPressProvider>{children}</FeedbackPressProvider>

const disabledWrapper = ({ children }: { children: React.ReactNode }) => <FeedbackPressProvider initialValue={{ vibrate: false }}>{children}</FeedbackPressProvider>

const soundWrapper =
  (sound: { selection?: jest.Mock; notification?: jest.Mock }) =>
  ({ children }: { children: React.ReactNode }) => <FeedbackPressProvider sound={sound}>{children}</FeedbackPressProvider>

beforeEach(() => {
  jest.clearAllMocks()
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

describe('useHoldToRepeat', () => {
  it('calls the action immediately on onLongPress, then again every repeatMs while held', async () => {
    const action = jest.fn()
    const { result, unmount } = renderHook(() => useHoldToRepeat(action, REPEAT_MS), { wrapper })

    act(() => {
      result.current.onLongPress()
    })
    expect(action).toHaveBeenCalledTimes(1)

    act(() => {
      jest.advanceTimersByTime(REPEAT_MS - 1)
    })
    expect(action).toHaveBeenCalledTimes(1)

    act(() => {
      jest.advanceTimersByTime(1)
    })
    expect(action).toHaveBeenCalledTimes(2)

    act(() => {
      jest.advanceTimersByTime(REPEAT_MS * 3)
    })
    expect(action).toHaveBeenCalledTimes(5)

    unmount()
  })

  it('stops on onPressOut — no further calls no matter how long afterward', async () => {
    const action = jest.fn()
    const { result, unmount } = renderHook(() => useHoldToRepeat(action, REPEAT_MS), { wrapper })

    act(() => {
      result.current.onLongPress()
    })
    act(() => {
      jest.advanceTimersByTime(REPEAT_MS * 2)
    })
    const callsBeforeRelease = action.mock.calls.length
    expect(callsBeforeRelease).toBeGreaterThan(1)

    act(() => {
      result.current.onPressOut()
    })
    act(() => {
      jest.advanceTimersByTime(REPEAT_MS * 10)
    })
    expect(action).toHaveBeenCalledTimes(callsBeforeRelease)

    unmount()
  })

  it('never starts a repeat at all if released before the first repeatMs elapses', async () => {
    const action = jest.fn()
    const { result, unmount } = renderHook(() => useHoldToRepeat(action, REPEAT_MS), { wrapper })

    act(() => {
      result.current.onLongPress()
    })
    expect(action).toHaveBeenCalledTimes(1)

    act(() => {
      result.current.onPressOut()
    })
    act(() => {
      jest.advanceTimersByTime(REPEAT_MS * 10)
    })
    expect(action).toHaveBeenCalledTimes(1)

    unmount()
  })

  // See useHoldToRepeat's own comment for the real, physical-hold bug this reproduces: a plain
  // closure over `action` inside setInterval never picks up a later render's fresh version, so
  // every tick after the first silently reran the exact same stale computation. A static
  // jest.fn() alone can't catch this — calling the same stale one over and over looks identical
  // to calling a fresh one. This rerenders the hook with a *different* action mid-hold (exactly
  // what a real useCallback keyed on changing state does every step) and asserts the repeat picks
  // up the new one, not the one closed over when the hold started.
  it('keeps calling whichever action is current as it changes identity mid-hold, not the one closed over when the hold started', async () => {
    const actionStep1 = jest.fn()
    const actionStep2 = jest.fn()
    const { result, rerender, unmount } = renderHook(({ action }: { action: () => void }) => useHoldToRepeat(action, REPEAT_MS), { wrapper, initialProps: { action: actionStep1 } })

    act(() => {
      result.current.onLongPress()
    })
    expect(actionStep1).toHaveBeenCalledTimes(1)

    act(() => {
      rerender({ action: actionStep2 })
    })

    act(() => {
      jest.advanceTimersByTime(REPEAT_MS)
    })

    expect(actionStep2).toHaveBeenCalledTimes(1)
    expect(actionStep1).toHaveBeenCalledTimes(1)

    unmount()
  })

  it('stops the interval on unmount rather than leaking it', async () => {
    const action = jest.fn()
    const { result, unmount } = renderHook(() => useHoldToRepeat(action, REPEAT_MS), { wrapper })

    act(() => {
      result.current.onLongPress()
    })
    const callsBeforeUnmount = action.mock.calls.length

    unmount()

    act(() => {
      jest.advanceTimersByTime(REPEAT_MS * 10)
    })
    expect(action).toHaveBeenCalledTimes(callsBeforeUnmount)
  })

  // A second onLongPress before the matching onPressOut (RN's gesture-responder negotiation can
  // plausibly double-fire it) must not leak the first interval - start() calls stop() first, the
  // same idempotent-start fix as the keyed hook's own equivalent test below. Without that guard,
  // the first interval would survive forever, uncontactable by any future onPressOut/unmount.
  it('a second onLongPress before onPressOut does not leak the first interval — onPressOut fully silences it', async () => {
    const action = jest.fn()
    const { result, unmount } = renderHook(() => useHoldToRepeat(action, REPEAT_MS), { wrapper })

    act(() => {
      result.current.onLongPress()
    })
    act(() => {
      result.current.onLongPress()
    })
    const callsAfterDoublePress = action.mock.calls.length

    act(() => {
      result.current.onPressOut()
    })
    act(() => {
      jest.advanceTimersByTime(REPEAT_MS * 10)
    })
    expect(action).toHaveBeenCalledTimes(callsAfterDoublePress)

    unmount()
  })

  describe('feedback', () => {
    it('fires a selection haptic (the default) on the initial press and every repeat tick, not just the first', () => {
      const action = jest.fn()
      const { result, unmount } = renderHook(() => useHoldToRepeat(action, REPEAT_MS), { wrapper })

      act(() => {
        result.current.onLongPress()
      })
      expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(1)

      act(() => {
        jest.advanceTimersByTime(REPEAT_MS * 2)
      })
      expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(3)
      expect(mockedHaptics.notificationAsync).not.toHaveBeenCalled()

      unmount()
    })

    it('fires a notification haptic instead when feedback: "notification" is passed', () => {
      const action = jest.fn()
      const { result, unmount } = renderHook(() => useHoldToRepeat(action, REPEAT_MS, { feedback: 'notification' }), { wrapper })

      act(() => {
        result.current.onLongPress()
      })
      act(() => {
        jest.advanceTimersByTime(REPEAT_MS)
      })

      expect(mockedHaptics.notificationAsync).toHaveBeenCalledTimes(2)
      expect(mockedHaptics.selectionAsync).not.toHaveBeenCalled()

      unmount()
    })

    it('fires no feedback at all when feedback: false, while the action itself still repeats normally', () => {
      const action = jest.fn()
      const { result, unmount } = renderHook(() => useHoldToRepeat(action, REPEAT_MS, { feedback: false }), { wrapper })

      act(() => {
        result.current.onLongPress()
      })
      act(() => {
        jest.advanceTimersByTime(REPEAT_MS * 2)
      })

      expect(action).toHaveBeenCalledTimes(3)
      expect(mockedHaptics.selectionAsync).not.toHaveBeenCalled()
      expect(mockedHaptics.notificationAsync).not.toHaveBeenCalled()

      unmount()
    })

    it('hapticDisabled suppresses the haptic but the action keeps firing', () => {
      const action = jest.fn()
      const { result, unmount } = renderHook(() => useHoldToRepeat(action, REPEAT_MS, { hapticDisabled: true }), { wrapper })

      act(() => {
        result.current.onLongPress()
      })
      act(() => {
        jest.advanceTimersByTime(REPEAT_MS)
      })

      expect(action).toHaveBeenCalledTimes(2)
      expect(mockedHaptics.selectionAsync).not.toHaveBeenCalled()

      unmount()
    })

    it('fires the sound callback from the provider alongside the haptic on every tick', () => {
      const mockSound = jest.fn()
      const action = jest.fn()
      const { result, unmount } = renderHook(() => useHoldToRepeat(action, REPEAT_MS), { wrapper: soundWrapper({ selection: mockSound }) })

      act(() => {
        result.current.onLongPress()
      })
      expect(mockSound).toHaveBeenCalledTimes(1)

      act(() => {
        jest.advanceTimersByTime(REPEAT_MS)
      })
      expect(mockSound).toHaveBeenCalledTimes(2)
      expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(2)

      unmount()
    })

    it('soundDisabled suppresses just the sound, keeping the haptic', () => {
      const mockSound = jest.fn()
      const action = jest.fn()
      const { result, unmount } = renderHook(() => useHoldToRepeat(action, REPEAT_MS, { soundDisabled: true }), { wrapper: soundWrapper({ selection: mockSound }) })

      act(() => {
        result.current.onLongPress()
      })

      expect(mockSound).not.toHaveBeenCalled()
      expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(1)

      unmount()
    })

    it('a per-call sound override takes priority over the provider sound, without touching the haptic', () => {
      const providerSound = jest.fn()
      const ownSound = jest.fn()
      const action = jest.fn()
      const { result, unmount } = renderHook(() => useHoldToRepeat(action, REPEAT_MS, { sound: { selection: ownSound } }), { wrapper: soundWrapper({ selection: providerSound }) })

      act(() => {
        result.current.onLongPress()
      })

      expect(ownSound).toHaveBeenCalledTimes(1)
      expect(providerSound).not.toHaveBeenCalled()
      expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(1)

      unmount()
    })

    it('respects the provider-wide vibrate toggle, the same as any other haptic in this package', () => {
      const action = jest.fn()
      const { result, unmount } = renderHook(() => useHoldToRepeat(action, REPEAT_MS), { wrapper: disabledWrapper })

      act(() => {
        result.current.onLongPress()
      })
      act(() => {
        jest.advanceTimersByTime(REPEAT_MS)
      })

      expect(action).toHaveBeenCalledTimes(2)
      expect(mockedHaptics.selectionAsync).not.toHaveBeenCalled()

      unmount()
    })

    // usePulse's returned closure is fresh every render (see useHoldToRepeat.ts), threaded through
    // latestPulse via the same ref+effect pattern latestAction uses for a changing action — this is
    // the pulse-side twin of "keeps calling whichever action is current" above, closing the same
    // stale-closure gap for feedback options instead of the action itself.
    it('picks up new options as they change identity mid-hold, not the ones closed over when the hold started', () => {
      const action = jest.fn()
      const { result, rerender, unmount } = renderHook(({ options }: { options: HoldToRepeatOptions }) => useHoldToRepeat(action, REPEAT_MS, options), {
        wrapper,
        initialProps: { options: { feedback: 'selection' } as HoldToRepeatOptions }
      })

      act(() => {
        result.current.onLongPress()
      })
      expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(1)

      act(() => {
        rerender({ options: { feedback: 'notification' } as HoldToRepeatOptions })
      })

      act(() => {
        jest.advanceTimersByTime(REPEAT_MS)
      })

      expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(1)
      expect(mockedHaptics.notificationAsync).toHaveBeenCalledTimes(1)

      unmount()
    })
  })
})

describe('useHoldToRepeatByKey', () => {
  it('calls the action with the held key immediately, then again every repeatMs while that key stays held', async () => {
    const action = jest.fn()
    const { result, unmount } = renderHook(() => useHoldToRepeatByKey(action, REPEAT_MS), { wrapper })

    act(() => {
      result.current.onLongPress('mirror')()
    })
    expect(action).toHaveBeenCalledTimes(1)
    expect(action).toHaveBeenLastCalledWith('mirror')

    act(() => {
      jest.advanceTimersByTime(REPEAT_MS)
    })
    expect(action).toHaveBeenCalledTimes(2)
    expect(action).toHaveBeenLastCalledWith('mirror')

    unmount()
  })

  // The whole reason this hook exists over reusing useHoldToRepeat once per target (see its own
  // comment) — two independently-held keys must keep entirely separate timers, neither stopping
  // nor restarting the other's.
  it('keeps two different keys repeating independently — releasing one leaves the other running', async () => {
    const action = jest.fn()
    const { result, unmount } = renderHook(() => useHoldToRepeatByKey(action, REPEAT_MS), { wrapper })

    act(() => {
      result.current.onLongPress('mirror')()
      result.current.onLongPress('pattern')()
    })
    expect(action).toHaveBeenCalledTimes(2)

    act(() => {
      result.current.onPressOut('mirror')()
    })
    act(() => {
      jest.advanceTimersByTime(REPEAT_MS * 3)
    })

    const mirrorCalls = action.mock.calls.filter(([key]) => key === 'mirror').length
    const patternCalls = action.mock.calls.filter(([key]) => key === 'pattern').length
    expect(mirrorCalls).toBe(1)
    expect(patternCalls).toBeGreaterThan(1)

    unmount()
  })

  it('stops on onPressOut for the released key — no further calls no matter how long afterward', async () => {
    const action = jest.fn()
    const { result, unmount } = renderHook(() => useHoldToRepeatByKey(action, REPEAT_MS), { wrapper })

    act(() => {
      result.current.onLongPress('settings')()
    })
    act(() => {
      jest.advanceTimersByTime(REPEAT_MS * 2)
    })
    const callsBeforeRelease = action.mock.calls.length

    act(() => {
      result.current.onPressOut('settings')()
    })
    act(() => {
      jest.advanceTimersByTime(REPEAT_MS * 10)
    })
    expect(action).toHaveBeenCalledTimes(callsBeforeRelease)

    unmount()
  })

  it('onPressOut for a key that was never held is a harmless no-op', async () => {
    const action = jest.fn()
    const { result, unmount } = renderHook(() => useHoldToRepeatByKey(action, REPEAT_MS), { wrapper })

    act(() => {
      result.current.onPressOut('settings')()
    })
    expect(action).not.toHaveBeenCalled()

    unmount()
  })

  it('stops every still-held key on unmount rather than leaking their intervals', async () => {
    const action = jest.fn()
    const { result, unmount } = renderHook(() => useHoldToRepeatByKey(action, REPEAT_MS), { wrapper })

    act(() => {
      result.current.onLongPress('mirror')()
      result.current.onLongPress('pattern')()
    })
    const callsBeforeUnmount = action.mock.calls.length

    unmount()
    act(() => {
      jest.advanceTimersByTime(REPEAT_MS * 10)
    })
    expect(action).toHaveBeenCalledTimes(callsBeforeUnmount)
  })

  // Keyed twin of the plain hook's own "second onLongPress before onPressOut" test above — Map.set
  // would otherwise silently overwrite a still-running key's interval id the same way a plain ref
  // assignment would, orphaning the first interval permanently.
  it('a second onLongPress for the same still-held key does not leak the first interval — onPressOut fully silences it', async () => {
    const action = jest.fn()
    const { result, unmount } = renderHook(() => useHoldToRepeatByKey(action, REPEAT_MS), { wrapper })

    act(() => {
      result.current.onLongPress('mirror')()
    })
    act(() => {
      result.current.onLongPress('mirror')()
    })
    const callsAfterDoublePress = action.mock.calls.length

    act(() => {
      result.current.onPressOut('mirror')()
    })
    act(() => {
      jest.advanceTimersByTime(REPEAT_MS * 10)
    })
    expect(action).toHaveBeenCalledTimes(callsAfterDoublePress)

    unmount()
  })

  describe('feedback', () => {
    it('fires a selection haptic on every tick regardless of which key is being held', () => {
      const action = jest.fn()
      const { result, unmount } = renderHook(() => useHoldToRepeatByKey(action, REPEAT_MS), { wrapper })

      act(() => {
        result.current.onLongPress('pattern')()
      })
      expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(1)

      act(() => {
        jest.advanceTimersByTime(REPEAT_MS)
      })
      expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(2)

      unmount()
    })

    it('feedback: false disables the pulse while the keyed action keeps firing', () => {
      const action = jest.fn()
      const { result, unmount } = renderHook(() => useHoldToRepeatByKey(action, REPEAT_MS, { feedback: false }), { wrapper })

      act(() => {
        result.current.onLongPress('pattern')()
      })
      act(() => {
        jest.advanceTimersByTime(REPEAT_MS)
      })

      expect(action).toHaveBeenCalledTimes(2)
      expect(mockedHaptics.selectionAsync).not.toHaveBeenCalled()

      unmount()
    })

    it('fires a notification haptic instead when feedback: "notification" is passed', () => {
      const action = jest.fn()
      const { result, unmount } = renderHook(() => useHoldToRepeatByKey(action, REPEAT_MS, { feedback: 'notification' }), { wrapper })

      act(() => {
        result.current.onLongPress('pattern')()
      })

      expect(mockedHaptics.notificationAsync).toHaveBeenCalledTimes(1)
      expect(mockedHaptics.selectionAsync).not.toHaveBeenCalled()

      unmount()
    })

    it('hapticDisabled suppresses the haptic but the keyed action keeps firing', () => {
      const action = jest.fn()
      const { result, unmount } = renderHook(() => useHoldToRepeatByKey(action, REPEAT_MS, { hapticDisabled: true }), { wrapper })

      act(() => {
        result.current.onLongPress('pattern')()
      })

      expect(action).toHaveBeenCalledTimes(1)
      expect(mockedHaptics.selectionAsync).not.toHaveBeenCalled()

      unmount()
    })

    it('soundDisabled suppresses just the sound, keeping the haptic', () => {
      const mockSound = jest.fn()
      const action = jest.fn()
      const { result, unmount } = renderHook(() => useHoldToRepeatByKey(action, REPEAT_MS, { soundDisabled: true }), { wrapper: soundWrapper({ selection: mockSound }) })

      act(() => {
        result.current.onLongPress('pattern')()
      })

      expect(mockSound).not.toHaveBeenCalled()
      expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(1)

      unmount()
    })

    it('a per-call sound override takes priority over the provider sound, without touching the haptic', () => {
      const providerSound = jest.fn()
      const ownSound = jest.fn()
      const action = jest.fn()
      const { result, unmount } = renderHook(() => useHoldToRepeatByKey(action, REPEAT_MS, { sound: { selection: ownSound } }), { wrapper: soundWrapper({ selection: providerSound }) })

      act(() => {
        result.current.onLongPress('pattern')()
      })

      expect(ownSound).toHaveBeenCalledTimes(1)
      expect(providerSound).not.toHaveBeenCalled()
      expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(1)

      unmount()
    })
  })
})
