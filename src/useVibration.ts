import * as haptics from 'expo-haptics'
import { useCallback, useEffect, useRef } from 'react'
import { Platform, Vibration } from 'react-native'

import { useFeedbackPressContext } from './FeedbackPressProvider'

const SHORT_DURATION = 50
const MEDIUM_DURATION = 200
const LONG_DURATION = 400
const DOUBLE_PULSE_DURATION = 150
const DOUBLE_GAP_DURATION = 100

// Android 11, where HapticFeedbackConstants gained CONFIRM and REJECT. Below it expo-haptics rejects them.
const ANDROID_CONFIRM_REJECT_API = 30

type ImpactStyle = haptics.ImpactFeedbackStyle.Light | haptics.ImpactFeedbackStyle.Medium | haptics.ImpactFeedbackStyle.Heavy

// Android's own haptic effects (View.performHapticFeedback through expo-haptics), the same engine its keyboard and
// switches use: short, crisp ticks shaped by the phone's haptics hardware, and they follow the system's touch feedback
// setting. expo-haptics' selectionAsync/impactAsync/notificationAsync, and RN's Vibration, drive the motor directly
// for a fixed time instead, a dull buzz that blurred into one long rumble when a game fired a dozen a second.
const ANDROID_SELECTION = haptics.AndroidHaptics.Clock_Tick
const ANDROID_IMPACT: Record<ImpactStyle, haptics.AndroidHaptics> = {
  [haptics.ImpactFeedbackStyle.Light]: haptics.AndroidHaptics.Clock_Tick,
  [haptics.ImpactFeedbackStyle.Medium]: haptics.AndroidHaptics.Virtual_Key,
  [haptics.ImpactFeedbackStyle.Heavy]: haptics.AndroidHaptics.Long_Press
}

const androidApi = (): number => (typeof Platform.Version === 'number' ? Platform.Version : 0)

const androidNotification = (type: haptics.NotificationFeedbackType): haptics.AndroidHaptics => {
  const success = type === haptics.NotificationFeedbackType.Success
  if (androidApi() < ANDROID_CONFIRM_REJECT_API) return success ? haptics.AndroidHaptics.Virtual_Key : haptics.AndroidHaptics.Long_Press
  return success ? haptics.AndroidHaptics.Confirm : haptics.AndroidHaptics.Reject
}

// A haptic is fire-and-forget: one that can't play (no activity yet, an effect the phone lacks) is simply not felt.
const performAndroid = (type: haptics.AndroidHaptics) => {
  haptics.performAndroidHapticsAsync(type).catch(() => undefined)
}

const impactStyleFor = (duration: number): ImpactStyle => (duration <= SHORT_DURATION ? haptics.ImpactFeedbackStyle.Light : duration <= MEDIUM_DURATION ? haptics.ImpactFeedbackStyle.Medium : haptics.ImpactFeedbackStyle.Heavy)

export const useVibration = () => {
  const { enabled } = useFeedbackPressContext()
  const isIOS = Platform.OS === 'ios'
  const isAndroid = Platform.OS === 'android'
  const doubleTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const clearDoubleTimeout = useCallback(() => {
    if (!doubleTimeout.current) return
    clearTimeout(doubleTimeout.current)
    doubleTimeout.current = undefined
  }, [])

  useEffect(() => clearDoubleTimeout, [clearDoubleTimeout])

  const playSelection = useCallback(() => {
    if (isIOS) void haptics.selectionAsync()
    else if (isAndroid) performAndroid(ANDROID_SELECTION)
    else Vibration.vibrate(30)
  }, [isIOS, isAndroid])

  const playNotification = useCallback(
    (type: haptics.NotificationFeedbackType) => {
      if (isIOS) void haptics.notificationAsync(type)
      else if (isAndroid) performAndroid(androidNotification(type))
      else Vibration.vibrate(120)
    },
    [isIOS, isAndroid]
  )

  const triggerDuration = useCallback(
    (duration?: number) => {
      if (!isIOS && !isAndroid) {
        Vibration.vibrate(duration)
        return
      }
      if (duration == null) {
        playSelection()
        return
      }
      // Longer than any haptic effect: a real vibration of that length is what's asked for.
      if (duration > LONG_DURATION) {
        Vibration.vibrate(duration)
        return
      }
      const style = impactStyleFor(duration)
      if (isIOS) void haptics.impactAsync(style)
      else performAndroid(ANDROID_IMPACT[style])
    },
    [isIOS, isAndroid, playSelection]
  )

  const pulse = useCallback(
    (duration?: number, force?: boolean) => {
      if (!force && !enabled) return
      triggerDuration(duration)
    },
    [triggerDuration, enabled]
  )

  const selection = useCallback(() => {
    if (!enabled) return
    playSelection()
  }, [enabled, playSelection])

  const notification = useCallback(
    (type: haptics.NotificationFeedbackType = haptics.NotificationFeedbackType.Success) => {
      if (!enabled) return
      playNotification(type)
    },
    [enabled, playNotification]
  )

  const short = useCallback(() => pulse(SHORT_DURATION), [pulse])
  const medium = useCallback(() => pulse(MEDIUM_DURATION), [pulse])
  const long = useCallback(() => pulse(LONG_DURATION), [pulse])

  const double = useCallback(
    (force?: boolean) => {
      if (!force && !enabled) return
      clearDoubleTimeout()
      if (isIOS || isAndroid) {
        playNotification(haptics.NotificationFeedbackType.Warning)
        doubleTimeout.current = setTimeout(() => {
          playNotification(haptics.NotificationFeedbackType.Success)
        }, DOUBLE_GAP_DURATION)
        return
      }
      Vibration.vibrate(DOUBLE_PULSE_DURATION)
      doubleTimeout.current = setTimeout(() => {
        Vibration.vibrate(DOUBLE_PULSE_DURATION)
      }, DOUBLE_GAP_DURATION)
    },
    [clearDoubleTimeout, isIOS, isAndroid, enabled, playNotification]
  )

  const custom = useCallback((duration: number) => pulse(duration), [pulse])
  const force = useCallback((duration?: number) => pulse(duration, true), [pulse])
  const forceShort = useCallback(() => pulse(SHORT_DURATION, true), [pulse])
  const forceMedium = useCallback(() => pulse(MEDIUM_DURATION, true), [pulse])
  const forceLong = useCallback(() => pulse(LONG_DURATION, true), [pulse])
  const forceDouble = useCallback(() => double(true), [double])

  return {
    isEnabled: enabled,
    selection,
    notification,
    short,
    medium,
    long,
    double,
    custom,
    force,
    forceShort,
    forceMedium,
    forceLong,
    forceDouble
  }
}
