import { act, renderHook } from '@testing-library/react'
import * as haptics from 'expo-haptics'
import React from 'react'
import { Platform, Vibration } from 'react-native'

import { FeedbackPressProvider } from '../FeedbackPressProvider'
import { useVibration } from '../useVibration'

const mockedHaptics = haptics as jest.Mocked<typeof haptics>
const mockedVibration = Vibration as jest.Mocked<typeof Vibration>

const wrapper = ({ children }: { children: React.ReactNode }) => <FeedbackPressProvider initialValue={{ vibrate: true }}>{children}</FeedbackPressProvider>

const disabledWrapper = ({ children }: { children: React.ReactNode }) => <FeedbackPressProvider initialValue={{ vibrate: false }}>{children}</FeedbackPressProvider>

beforeEach(() => {
  jest.clearAllMocks()
  Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true })
})

describe('useVibration (iOS)', () => {
  it('selection() calls selectionAsync', () => {
    const { result } = renderHook(() => useVibration(), { wrapper })
    act(() => {
      result.current.selection()
    })
    expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(1)
  })

  it('notification() calls notificationAsync with Success by default', () => {
    const { result } = renderHook(() => useVibration(), { wrapper })
    act(() => {
      result.current.notification()
    })
    expect(mockedHaptics.notificationAsync).toHaveBeenCalledWith(haptics.NotificationFeedbackType.Success)
  })

  it('notification() passes through custom type', () => {
    const { result } = renderHook(() => useVibration(), { wrapper })
    act(() => {
      result.current.notification(haptics.NotificationFeedbackType.Warning)
    })
    expect(mockedHaptics.notificationAsync).toHaveBeenCalledWith(haptics.NotificationFeedbackType.Warning)
  })

  it('short() calls impactAsync with Light style', () => {
    const { result } = renderHook(() => useVibration(), { wrapper })
    act(() => {
      result.current.short()
    })
    expect(mockedHaptics.impactAsync).toHaveBeenCalledWith(haptics.ImpactFeedbackStyle.Light)
  })

  it('medium() calls impactAsync with Medium style', () => {
    const { result } = renderHook(() => useVibration(), { wrapper })
    act(() => {
      result.current.medium()
    })
    expect(mockedHaptics.impactAsync).toHaveBeenCalledWith(haptics.ImpactFeedbackStyle.Medium)
  })

  it('long() calls impactAsync with Heavy style', () => {
    const { result } = renderHook(() => useVibration(), { wrapper })
    act(() => {
      result.current.long()
    })
    expect(mockedHaptics.impactAsync).toHaveBeenCalledWith(haptics.ImpactFeedbackStyle.Heavy)
  })

  it('double() calls notificationAsync twice', () => {
    jest.useFakeTimers()
    const { result } = renderHook(() => useVibration(), { wrapper })
    act(() => {
      result.current.double()
    })
    expect(mockedHaptics.notificationAsync).toHaveBeenCalledTimes(1)
    act(() => {
      jest.runAllTimers()
    })
    expect(mockedHaptics.notificationAsync).toHaveBeenCalledTimes(2)
    jest.useRealTimers()
  })
})

describe('useVibration (Android)', () => {
  // Every haptic is one of Android's own effects (expo-haptics' performAndroidHapticsAsync), never a timed buzz of the motor.
  const performed = () => mockedHaptics.performAndroidHapticsAsync.mock.calls.map(([type]) => type)

  beforeEach(() => {
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true })
    Object.defineProperty(Platform, 'Version', { value: 35, configurable: true })
  })

  afterAll(() => {
    Object.defineProperty(Platform, 'Version', { value: undefined, configurable: true })
  })

  it('selection() plays a tick', () => {
    const { result } = renderHook(() => useVibration(), { wrapper })
    act(() => {
      result.current.selection()
    })
    expect(performed()).toEqual([haptics.AndroidHaptics.Clock_Tick])
    expect(mockedVibration.vibrate).not.toHaveBeenCalled()
    expect(mockedHaptics.selectionAsync).not.toHaveBeenCalled()
  })

  it('short(), medium() and long() play a tick, a key click and a long press', () => {
    const { result } = renderHook(() => useVibration(), { wrapper })
    act(() => {
      result.current.short()
      result.current.medium()
      result.current.long()
    })
    expect(performed()).toEqual([haptics.AndroidHaptics.Clock_Tick, haptics.AndroidHaptics.Virtual_Key, haptics.AndroidHaptics.Long_Press])
    expect(mockedVibration.vibrate).not.toHaveBeenCalled()
    expect(mockedHaptics.impactAsync).not.toHaveBeenCalled()
  })

  it('force() with no duration is a selection, as on iOS', () => {
    const { result } = renderHook(() => useVibration(), { wrapper: disabledWrapper })
    act(() => {
      result.current.force()
    })
    expect(performed()).toEqual([haptics.AndroidHaptics.Clock_Tick])
    expect(mockedVibration.vibrate).not.toHaveBeenCalled()
  })

  it('a duration longer than any haptic still vibrates for that long', () => {
    const { result } = renderHook(() => useVibration(), { wrapper })
    act(() => {
      result.current.custom(800)
    })
    expect(mockedVibration.vibrate).toHaveBeenCalledWith(800)
    expect(performed()).toEqual([])
  })

  it('notification() confirms a success and rejects a warning or an error', () => {
    const { result } = renderHook(() => useVibration(), { wrapper })
    act(() => {
      result.current.notification()
      result.current.notification(haptics.NotificationFeedbackType.Warning)
      result.current.notification(haptics.NotificationFeedbackType.Error)
    })
    expect(performed()).toEqual([haptics.AndroidHaptics.Confirm, haptics.AndroidHaptics.Reject, haptics.AndroidHaptics.Reject])
    expect(mockedHaptics.notificationAsync).not.toHaveBeenCalled()
    expect(mockedVibration.vibrate).not.toHaveBeenCalled()
  })

  it('notification() falls back to effects every Android has before Android 11', () => {
    Object.defineProperty(Platform, 'Version', { value: 29, configurable: true })
    const { result } = renderHook(() => useVibration(), { wrapper })
    act(() => {
      result.current.notification()
      result.current.notification(haptics.NotificationFeedbackType.Error)
    })
    expect(performed()).toEqual([haptics.AndroidHaptics.Virtual_Key, haptics.AndroidHaptics.Long_Press])
  })

  it('double() rejects, then confirms after the gap', () => {
    jest.useFakeTimers()
    const { result } = renderHook(() => useVibration(), { wrapper })
    act(() => {
      result.current.double()
    })
    expect(performed()).toEqual([haptics.AndroidHaptics.Reject])
    act(() => {
      jest.runAllTimers()
    })
    expect(performed()).toEqual([haptics.AndroidHaptics.Reject, haptics.AndroidHaptics.Confirm])
    expect(mockedVibration.vibrate).not.toHaveBeenCalled()
    jest.useRealTimers()
  })

  it('a haptic the phone cannot play is caught, not left an unhandled rejection', async () => {
    const failed = Promise.reject(new Error('unsupported'))
    const caught = jest.spyOn(failed, 'catch')
    mockedHaptics.performAndroidHapticsAsync.mockReturnValueOnce(failed)
    const { result } = renderHook(() => useVibration(), { wrapper })
    act(() => {
      result.current.selection()
    })
    expect(caught).toHaveBeenCalledTimes(1)
    await expect(caught.mock.results[0].value).resolves.toBeUndefined()
  })

  it('does nothing when disabled', () => {
    const { result } = renderHook(() => useVibration(), { wrapper: disabledWrapper })
    act(() => {
      result.current.selection()
      result.current.notification()
      result.current.short()
      result.current.double()
    })
    expect(performed()).toEqual([])
    expect(mockedVibration.vibrate).not.toHaveBeenCalled()
  })
})

describe('useVibration (web)', () => {
  beforeEach(() => {
    Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true })
  })

  it('selection() and short() still use the Vibration API', () => {
    const { result } = renderHook(() => useVibration(), { wrapper })
    act(() => {
      result.current.selection()
      result.current.short()
    })
    expect(mockedVibration.vibrate.mock.calls).toEqual([[30], [50]])
    expect(mockedHaptics.performAndroidHapticsAsync).not.toHaveBeenCalled()
  })
})

describe('useVibration (disabled)', () => {
  it('selection() does nothing when disabled', () => {
    const { result } = renderHook(() => useVibration(), { wrapper: disabledWrapper })
    act(() => {
      result.current.selection()
    })
    expect(mockedHaptics.selectionAsync).not.toHaveBeenCalled()
    expect(mockedVibration.vibrate).not.toHaveBeenCalled()
  })

  it('short() does nothing when disabled', () => {
    const { result } = renderHook(() => useVibration(), { wrapper: disabledWrapper })
    act(() => {
      result.current.short()
    })
    expect(mockedHaptics.impactAsync).not.toHaveBeenCalled()
  })

  it('double() does nothing when disabled', () => {
    const { result } = renderHook(() => useVibration(), { wrapper: disabledWrapper })
    act(() => {
      result.current.double()
    })
    expect(mockedHaptics.notificationAsync).not.toHaveBeenCalled()
  })

  it('isEnabled reflects provider value', () => {
    const { result } = renderHook(() => useVibration(), { wrapper: disabledWrapper })
    expect(result.current.isEnabled).toBe(false)
  })
})

describe('useVibration (force methods)', () => {
  it('forceShort() fires even when disabled', () => {
    const { result } = renderHook(() => useVibration(), { wrapper: disabledWrapper })
    act(() => {
      result.current.forceShort()
    })
    expect(mockedHaptics.impactAsync).toHaveBeenCalledWith(haptics.ImpactFeedbackStyle.Light)
  })

  it('forceMedium() fires even when disabled', () => {
    const { result } = renderHook(() => useVibration(), { wrapper: disabledWrapper })
    act(() => {
      result.current.forceMedium()
    })
    expect(mockedHaptics.impactAsync).toHaveBeenCalledWith(haptics.ImpactFeedbackStyle.Medium)
  })

  it('forceLong() fires even when disabled', () => {
    const { result } = renderHook(() => useVibration(), { wrapper: disabledWrapper })
    act(() => {
      result.current.forceLong()
    })
    expect(mockedHaptics.impactAsync).toHaveBeenCalledWith(haptics.ImpactFeedbackStyle.Heavy)
  })

  it('forceDouble() fires even when disabled', () => {
    jest.useFakeTimers()
    const { result } = renderHook(() => useVibration(), { wrapper: disabledWrapper })
    act(() => {
      result.current.forceDouble()
    })
    expect(mockedHaptics.notificationAsync).toHaveBeenCalledTimes(1)
    act(() => {
      jest.runAllTimers()
    })
    expect(mockedHaptics.notificationAsync).toHaveBeenCalledTimes(2)
    jest.useRealTimers()
  })
})
