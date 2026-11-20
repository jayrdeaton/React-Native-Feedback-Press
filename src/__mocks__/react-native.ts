import React from 'react'

const stub = ({ children }: { children?: React.ReactNode }) => children ?? null

// flatten merges nested style arrays left to right and skips falsy entries, like the real one.
// renderWithHitSlop splits a flattened style by key, so a passthrough would hand it an array.
const flatten = (style: unknown): Record<string, unknown> | undefined => {
  if (!style) return undefined
  if (Array.isArray(style)) return style.reduce<Record<string, unknown>>((merged, entry) => ({ ...merged, ...flatten(entry) }), {})
  return style as Record<string, unknown>
}

const StyleSheet = {
  create: <T extends object>(styles: T): T => styles,
  flatten
}

const Vibration = {
  vibrate: jest.fn()
}

const Platform = {
  OS: 'ios' as 'ios' | 'android',
  select: (obj: Record<string, unknown>) => obj[Platform.OS] ?? obj.default
}

// addEventListener keeps its listeners, so a test can move the app between states with
// AppState.__setState and see what each listener does.
type AppStateListener = (state: string) => void
const appStateListeners = new Set<AppStateListener>()
const AppState = {
  currentState: 'active',
  addEventListener: jest.fn((_type: string, listener: AppStateListener) => {
    appStateListeners.add(listener)
    return { remove: () => appStateListeners.delete(listener) }
  }),
  __setState: (state: string) => {
    AppState.currentState = state
    appStateListeners.forEach((listener) => listener(state))
  },
  __listenerCount: () => appStateListeners.size
}

export { AppState, Platform, StyleSheet, Vibration }

export const View = stub
export const Text = stub
export const Image = jest.fn(stub)
export const Pressable = jest.fn(stub)
export const Switch = jest.fn(stub)
export const TouchableOpacity = jest.fn(stub)
export const TouchableHighlight = jest.fn(stub)
export const TouchableNativeFeedback = stub
export const TouchableWithoutFeedback = stub
