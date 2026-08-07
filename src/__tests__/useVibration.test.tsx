import { renderHook, act } from '@testing-library/react'
import * as haptics from 'expo-haptics'
import { Platform, Vibration } from 'react-native'
import React from 'react'

import { HapticPressProvider } from '../HapticPressProvider'
import { useVibration } from '../useVibration'

const mockedHaptics = haptics as jest.Mocked<typeof haptics>
const mockedVibration = Vibration as jest.Mocked<typeof Vibration>

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <HapticPressProvider initialValue={{ vibrate: true }}>{children}</HapticPressProvider>
)

const disabledWrapper = ({ children }: { children: React.ReactNode }) => (
  <HapticPressProvider initialValue={{ vibrate: false }}>{children}</HapticPressProvider>
)

beforeEach(() => {
  jest.clearAllMocks()
  Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true })
})

describe('useVibration (iOS)', () => {
  it('selection() calls selectionAsync', () => {
    const { result } = renderHook(() => useVibration(), { wrapper })
    act(() => { result.current.selection() })
    expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(1)
  })

  it('notification() calls notificationAsync with Success by default', () => {
    const { result } = renderHook(() => useVibration(), { wrapper })
    act(() => { result.current.notification() })
    expect(mockedHaptics.notificationAsync).toHaveBeenCalledWith(haptics.NotificationFeedbackType.Success)
  })

  it('notification() passes through custom type', () => {
    const { result } = renderHook(() => useVibration(), { wrapper })
    act(() => { result.current.notification(haptics.NotificationFeedbackType.Warning) })
    expect(mockedHaptics.notificationAsync).toHaveBeenCalledWith(haptics.NotificationFeedbackType.Warning)
  })

  it('short() calls impactAsync with Light style', () => {
    const { result } = renderHook(() => useVibration(), { wrapper })
    act(() => { result.current.short() })
    expect(mockedHaptics.impactAsync).toHaveBeenCalledWith(haptics.ImpactFeedbackStyle.Light)
  })

  it('medium() calls impactAsync with Medium style', () => {
    const { result } = renderHook(() => useVibration(), { wrapper })
    act(() => { result.current.medium() })
    expect(mockedHaptics.impactAsync).toHaveBeenCalledWith(haptics.ImpactFeedbackStyle.Medium)
  })

  it('long() calls impactAsync with Heavy style', () => {
    const { result } = renderHook(() => useVibration(), { wrapper })
    act(() => { result.current.long() })
    expect(mockedHaptics.impactAsync).toHaveBeenCalledWith(haptics.ImpactFeedbackStyle.Heavy)
  })

  it('double() calls notificationAsync twice', () => {
    jest.useFakeTimers()
    const { result } = renderHook(() => useVibration(), { wrapper })
    act(() => { result.current.double() })
    expect(mockedHaptics.notificationAsync).toHaveBeenCalledTimes(1)
    act(() => { jest.runAllTimers() })
    expect(mockedHaptics.notificationAsync).toHaveBeenCalledTimes(2)
    jest.useRealTimers()
  })
})

describe('useVibration (Android)', () => {
  beforeEach(() => {
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true })
  })

  it('selection() calls Vibration.vibrate', () => {
    const { result } = renderHook(() => useVibration(), { wrapper })
    act(() => { result.current.selection() })
    expect(mockedVibration.vibrate).toHaveBeenCalled()
    expect(mockedHaptics.selectionAsync).not.toHaveBeenCalled()
  })

  it('short() calls Vibration.vibrate', () => {
    const { result } = renderHook(() => useVibration(), { wrapper })
    act(() => { result.current.short() })
    expect(mockedVibration.vibrate).toHaveBeenCalled()
    expect(mockedHaptics.impactAsync).not.toHaveBeenCalled()
  })
})

describe('useVibration (disabled)', () => {
  it('selection() does nothing when disabled', () => {
    const { result } = renderHook(() => useVibration(), { wrapper: disabledWrapper })
    act(() => { result.current.selection() })
    expect(mockedHaptics.selectionAsync).not.toHaveBeenCalled()
    expect(mockedVibration.vibrate).not.toHaveBeenCalled()
  })

  it('short() does nothing when disabled', () => {
    const { result } = renderHook(() => useVibration(), { wrapper: disabledWrapper })
    act(() => { result.current.short() })
    expect(mockedHaptics.impactAsync).not.toHaveBeenCalled()
  })

  it('double() does nothing when disabled', () => {
    const { result } = renderHook(() => useVibration(), { wrapper: disabledWrapper })
    act(() => { result.current.double() })
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
    act(() => { result.current.forceShort() })
    expect(mockedHaptics.impactAsync).toHaveBeenCalledWith(haptics.ImpactFeedbackStyle.Light)
  })

  it('forceMedium() fires even when disabled', () => {
    const { result } = renderHook(() => useVibration(), { wrapper: disabledWrapper })
    act(() => { result.current.forceMedium() })
    expect(mockedHaptics.impactAsync).toHaveBeenCalledWith(haptics.ImpactFeedbackStyle.Medium)
  })

  it('forceLong() fires even when disabled', () => {
    const { result } = renderHook(() => useVibration(), { wrapper: disabledWrapper })
    act(() => { result.current.forceLong() })
    expect(mockedHaptics.impactAsync).toHaveBeenCalledWith(haptics.ImpactFeedbackStyle.Heavy)
  })

  it('forceDouble() fires even when disabled', () => {
    jest.useFakeTimers()
    const { result } = renderHook(() => useVibration(), { wrapper: disabledWrapper })
    act(() => { result.current.forceDouble() })
    expect(mockedHaptics.notificationAsync).toHaveBeenCalledTimes(1)
    act(() => { jest.runAllTimers() })
    expect(mockedHaptics.notificationAsync).toHaveBeenCalledTimes(2)
    jest.useRealTimers()
  })
})
