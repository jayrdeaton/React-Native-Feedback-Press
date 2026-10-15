import { render } from '@testing-library/react'
import * as haptics from 'expo-haptics'
import React from 'react'
import { Pressable as RNPressable } from 'react-native'
import * as Paper from 'react-native-paper'

import { FeedbackPressProvider } from '../FeedbackPressProvider'
import { AppbarAction, AppbarBackAction, IconButton } from '../index'
import type { PaperModuleShape } from '../PaperContext'

// Paper's IconButton clips its touchable to its own box (a Surface with overflow: 'hidden'), so a
// hitSlop handed straight to Paper never reaches past it on device. These cover the wrapper that
// owns the slop instead (renderWithHitSlop) for IconButton and the two Appbar actions built on it.
const mockedHaptics = haptics as jest.Mocked<typeof haptics>
const mockPaper = Paper as unknown as PaperModuleShape

const MockPressable = RNPressable as unknown as jest.Mock
const MockIconButton = Paper.IconButton as unknown as jest.Mock
const MockAction = Paper.Appbar.Action as unknown as jest.Mock
const MockBackAction = Paper.Appbar.BackAction as unknown as jest.Mock

const mockEvent = {} as any

const lastProps = (mock: jest.Mock) => mock.mock.calls[mock.mock.calls.length - 1][0]

const flatten = (style: unknown): Record<string, unknown> =>
  ([] as unknown[])
    .concat(style as never)
    .flat(Infinity)
    .filter(Boolean)
    .reduce<Record<string, unknown>>((merged, entry) => ({ ...merged, ...(entry as Record<string, unknown>) }), {})

const placedStyle = { position: 'absolute', top: 28, left: 18, transform: [{ rotate: '90deg' }], backgroundColor: 'red', opacity: 0.5 } as const
const noMargin = { margin: 0 }
const leftMargin = { marginLeft: 12 }

const withPaper = ({ children }: { children: React.ReactNode }) => (
  <FeedbackPressProvider initialValue={{ vibrate: true }} paper={mockPaper}>
    {children}
  </FeedbackPressProvider>
)

const withoutPaper = ({ children }: { children: React.ReactNode }) => <FeedbackPressProvider initialValue={{ vibrate: true }}>{children}</FeedbackPressProvider>

beforeEach(() => jest.clearAllMocks())

describe('IconButton hitSlop', () => {
  it('renders Paper directly, with no wrapper, when hitSlop is omitted', () => {
    const style = { position: 'absolute', top: 8 }
    render(<IconButton icon='cog' onPress={jest.fn()} style={style} />, { wrapper: withPaper })

    expect(MockPressable).not.toHaveBeenCalled()
    expect(lastProps(MockIconButton).style).toBe(style)
  })

  it('moves hitSlop onto a wrapper Pressable and keeps it off Paper, whose own slop is clipped', () => {
    render(<IconButton icon='cog' onPress={jest.fn()} hitSlop={4} />, { wrapper: withPaper })

    const target = lastProps(MockPressable)
    expect(target.hitSlop).toBe(4)
    expect(target.disabled).toBe(false)
    expect(lastProps(MockIconButton).hitSlop).toBeUndefined()
    expect(lastProps(MockIconButton).icon).toBe('cog')
  })

  it('accepts Insets as well as a number', () => {
    const insets = { top: 4, bottom: 4, left: 4, right: 4 }
    render(<IconButton icon='cog' onPress={jest.fn()} hitSlop={insets} />, { wrapper: withPaper })

    expect(lastProps(MockPressable).hitSlop).toBe(insets)
  })

  it("puts placement and Paper's 6pt margin on the wrapper, and leaves the look on Paper with no margin", () => {
    render(<IconButton icon='cog' onPress={jest.fn()} hitSlop={4} style={placedStyle} />, { wrapper: withPaper })

    expect(flatten(lastProps(MockPressable).style)).toEqual({ margin: 6, position: 'absolute', top: 28, left: 18, transform: [{ rotate: '90deg' }] })
    expect(flatten(lastProps(MockIconButton).style)).toEqual({ backgroundColor: 'red', opacity: 0.5, margin: 0 })
  })

  it("lets a caller's own margins override the wrapper's 6pt default", () => {
    render(<IconButton icon='cog' onPress={jest.fn()} hitSlop={4} style={[noMargin, leftMargin]} />, { wrapper: withPaper })

    expect(flatten(lastProps(MockPressable).style)).toEqual({ margin: 0, marginLeft: 12 })
    expect(flatten(lastProps(MockIconButton).style)).toEqual({ margin: 0 })
  })

  it('runs the same wired handlers from the slop band: selection on press-in, then the callback', () => {
    const onPress = jest.fn()
    const onLongPress = jest.fn()
    const onPressOut = jest.fn()
    render(<IconButton icon='cog' onPress={onPress} onLongPress={onLongPress} onPressOut={onPressOut} delayLongPress={400} hitSlop={4} />, { wrapper: withPaper })

    const target = lastProps(MockPressable)
    target.onPressIn(mockEvent)
    expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(1)
    target.onPress(mockEvent)
    expect(onPress).toHaveBeenCalledTimes(1)
    target.onLongPress(mockEvent)
    expect(mockedHaptics.notificationAsync).toHaveBeenCalledTimes(1)
    expect(onLongPress).toHaveBeenCalledTimes(1)
    target.onPressOut(mockEvent)
    expect(onPressOut).toHaveBeenCalledTimes(1)
    expect(target.delayLongPress).toBe(400)

    // Paper's own touchable gets the same wiring, for presses inside the button itself.
    const button = lastProps(MockIconButton)
    expect(button.onPress).toBe(target.onPress)
    expect(button.onPressIn).toBe(target.onPressIn)
  })

  it('hides the wrapper from accessibility and focus, leaving Paper as the button', () => {
    render(<IconButton icon='cog' onPress={jest.fn()} hitSlop={4} accessibilityLabel='Settings' />, { wrapper: withPaper })

    const target = lastProps(MockPressable)
    expect(target.accessible).toBe(false)
    expect(target.focusable).toBe(false)
    expect(target.importantForAccessibility).toBe('no')
    expect(target.accessibilityLabel).toBeUndefined()
    expect(lastProps(MockIconButton).accessibilityLabel).toBe('Settings')
  })

  it('disables the wrapper when the button is disabled, and passes disabled on to Paper', () => {
    render(<IconButton icon='cog' onPress={jest.fn()} hitSlop={4} disabled />, { wrapper: withPaper })

    expect(lastProps(MockPressable).disabled).toBe(true)
    expect(lastProps(MockIconButton).disabled).toBe(true)
  })

  it('disables the wrapper when the button has no touch handler, so its slop never swallows a touch', () => {
    render(<IconButton icon='cog' hitSlop={4} />, { wrapper: withPaper })

    expect(lastProps(MockPressable).disabled).toBe(true)
  })

  it('forwards hitSlop to the plain-RN fallback without paper injected', () => {
    render(<IconButton icon='cog' onPress={jest.fn()} hitSlop={4} />, { wrapper: withoutPaper })

    expect(MockPressable).toHaveBeenCalledTimes(1)
    expect(lastProps(MockPressable).hitSlop).toBe(4)
  })
})

describe('AppbarAction hitSlop', () => {
  it('wraps Paper in the same slop target, firing selection on press', () => {
    const onPress = jest.fn()
    render(<AppbarAction icon='menu' onPress={onPress} hitSlop={4} />, { wrapper: withPaper })

    const target = lastProps(MockPressable)
    expect(target.hitSlop).toBe(4)
    expect(lastProps(MockAction).hitSlop).toBeUndefined()
    expect(lastProps(MockAction).icon).toBe('menu')
    target.onPress(mockEvent)
    expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(1)
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('renders Paper directly when hitSlop is omitted', () => {
    render(<AppbarAction icon='menu' onPress={jest.fn()} />, { wrapper: withPaper })

    expect(MockPressable).not.toHaveBeenCalled()
    expect(MockAction).toHaveBeenCalled()
  })

  it('forwards hitSlop to the plain-RN fallback without paper injected', () => {
    render(<AppbarAction icon='menu' onPress={jest.fn()} hitSlop={4} />, { wrapper: withoutPaper })

    expect(lastProps(MockPressable).hitSlop).toBe(4)
  })
})

describe('AppbarBackAction hitSlop', () => {
  it('wraps Paper in the same slop target, firing selection on press', () => {
    const onPress = jest.fn()
    render(<AppbarBackAction onPress={onPress} hitSlop={4} />, { wrapper: withPaper })

    const target = lastProps(MockPressable)
    expect(target.hitSlop).toBe(4)
    expect(lastProps(MockBackAction).hitSlop).toBeUndefined()
    target.onPress(mockEvent)
    expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(1)
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('renders Paper directly when hitSlop is omitted', () => {
    render(<AppbarBackAction onPress={jest.fn()} />, { wrapper: withPaper })

    expect(MockPressable).not.toHaveBeenCalled()
    expect(MockBackAction).toHaveBeenCalled()
  })

  it('forwards hitSlop to the plain-RN fallback without paper injected', () => {
    render(<AppbarBackAction onPress={jest.fn()} hitSlop={4} />, { wrapper: withoutPaper })

    expect(lastProps(MockPressable).hitSlop).toBe(4)
  })
})
