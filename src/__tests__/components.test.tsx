import { render } from '@testing-library/react'
import * as haptics from 'expo-haptics'
import { Platform } from 'react-native'
import * as Paper from 'react-native-paper'
import React from 'react'

import { FeedbackPressProvider } from '../FeedbackPressProvider'
import { Button, IconButton, TouchableRipple, Card, AppbarAction, AppbarBackAction, Chip, FAB, Checkbox, Switch, SegmentedButtons } from '../index'
import type { PaperModuleShape } from '../PaperContext'

const mockedHaptics = haptics as jest.Mocked<typeof haptics>
// react-native-paper is no longer auto-detected via require() - it must be injected via
// <FeedbackPressProvider paper={...}>. Pass the same mocked module the assertions below inspect.
const mockPaper = Paper as unknown as PaperModuleShape

// Double-cast needed because TS sees the real Paper types, not the jest.fn() mocks
const MockButton = Paper.Button as unknown as jest.Mock
const MockIconButton = Paper.IconButton as unknown as jest.Mock
const MockTouchableRipple = Paper.TouchableRipple as unknown as jest.Mock
const MockCard = Paper.Card as unknown as jest.Mock
const MockBackAction = Paper.Appbar.BackAction as unknown as jest.Mock
const MockAction = Paper.Appbar.Action as unknown as jest.Mock
const MockChip = Paper.Chip as unknown as jest.Mock
const MockFAB = Paper.FAB as unknown as jest.Mock
const MockCheckbox = Paper.Checkbox as unknown as jest.Mock
const MockSwitch = Paper.Switch as unknown as jest.Mock
const MockSegmentedButtons = Paper.SegmentedButtons as unknown as jest.Mock

const mockEvent = {} as any

const enabled = ({ children }: { children: React.ReactNode }) => (
  <FeedbackPressProvider initialValue={{ vibrate: true }} paper={mockPaper}>
    {children}
  </FeedbackPressProvider>
)

const disabled = ({ children }: { children: React.ReactNode }) => (
  <FeedbackPressProvider initialValue={{ vibrate: false }} paper={mockPaper}>
    {children}
  </FeedbackPressProvider>
)

beforeEach(() => {
  jest.clearAllMocks()
  Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true })
})

// Get the props from the most recent render of a mocked Paper component
const lastProps = (mock: jest.Mock) => mock.mock.calls[mock.mock.calls.length - 1][0]

describe('Button', () => {
  it('fires selection on onPressIn when onPress is provided', () => {
    render(<Button onPress={jest.fn()}>{null}</Button>, { wrapper: enabled })
    lastProps(MockButton).onPressIn(mockEvent)
    expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(1)
  })

  it('does not fire haptic on onPressIn when element is not interactive', () => {
    render(<Button>{null}</Button>, { wrapper: enabled })
    lastProps(MockButton).onPressIn?.(mockEvent)
    expect(mockedHaptics.selectionAsync).not.toHaveBeenCalled()
  })

  it('calls the original onPressIn alongside the haptic', () => {
    const onPressIn = jest.fn()
    render(<Button onPress={jest.fn()} onPressIn={onPressIn}>{null}</Button>, { wrapper: enabled })
    lastProps(MockButton).onPressIn(mockEvent)
    expect(onPressIn).toHaveBeenCalledWith(mockEvent)
  })

  it('passes onPress through unchanged: no haptic on press', () => {
    const onPress = jest.fn()
    render(<Button onPress={onPress}>{null}</Button>, { wrapper: enabled })
    lastProps(MockButton).onPress(mockEvent)
    expect(onPress).toHaveBeenCalledWith(mockEvent)
    expect(mockedHaptics.selectionAsync).not.toHaveBeenCalled()
  })

  it('fires notification on onLongPress', () => {
    const onLongPress = jest.fn()
    render(<Button onLongPress={onLongPress}>{null}</Button>, { wrapper: enabled })
    lastProps(MockButton).onLongPress(mockEvent)
    expect(mockedHaptics.notificationAsync).toHaveBeenCalledTimes(1)
    expect(onLongPress).toHaveBeenCalledWith(mockEvent)
  })

  it('treats element as interactive when only onLongPress is provided', () => {
    render(<Button onLongPress={jest.fn()}>{null}</Button>, { wrapper: enabled })
    lastProps(MockButton).onPressIn(mockEvent)
    expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(1)
  })

  it('does not fire haptics when provider is disabled', () => {
    render(<Button onPress={jest.fn()}>{null}</Button>, { wrapper: disabled })
    lastProps(MockButton).onPressIn(mockEvent)
    expect(mockedHaptics.selectionAsync).not.toHaveBeenCalled()
  })
})

describe('IconButton', () => {
  it('fires selection on onPressIn', () => {
    render(<IconButton icon="star" onPress={jest.fn()} />, { wrapper: enabled })
    lastProps(MockIconButton).onPressIn(mockEvent)
    expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(1)
  })
})

describe('TouchableRipple', () => {
  it('fires selection on onPressIn', () => {
    render(<TouchableRipple onPress={jest.fn()}>{null}</TouchableRipple>, { wrapper: enabled })
    lastProps(MockTouchableRipple).onPressIn(mockEvent)
    expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(1)
  })
})

describe('Card', () => {
  it('fires selection on onPressIn', () => {
    render(<Card onPress={jest.fn()}>{null}</Card>, { wrapper: enabled })
    lastProps(MockCard).onPressIn(mockEvent)
    expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(1)
  })

  it('fires notification on onLongPress (no event arg)', () => {
    const onLongPress = jest.fn()
    render(<Card onLongPress={onLongPress}>{null}</Card>, { wrapper: enabled })
    lastProps(MockCard).onLongPress()
    expect(mockedHaptics.notificationAsync).toHaveBeenCalledTimes(1)
    expect(onLongPress).toHaveBeenCalled()
  })
})

describe('AppbarBackAction', () => {
  it('fires selection on onPress (no onPressIn exposed by Paper)', () => {
    const onPress = jest.fn()
    render(<AppbarBackAction onPress={onPress} />, { wrapper: enabled })
    lastProps(MockBackAction).onPress()
    expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(1)
    expect(onPress).toHaveBeenCalled()
  })
})

describe('AppbarAction', () => {
  it('fires selection on onPress (no onPressIn: same as AppbarBackAction, its own underlying implementation)', () => {
    const onPress = jest.fn()
    render(<AppbarAction icon="menu" onPress={onPress} />, { wrapper: enabled })
    lastProps(MockAction).onPress()
    expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(1)
    expect(onPress).toHaveBeenCalled()
  })

  it('does not fire haptic when onPress is not provided', () => {
    render(<AppbarAction icon="menu" />, { wrapper: enabled })
    lastProps(MockAction).onPress?.()
    expect(mockedHaptics.selectionAsync).not.toHaveBeenCalled()
  })
})

describe('Chip', () => {
  it('fires selection on onPressIn', () => {
    render(<Chip onPress={jest.fn()}>{null}</Chip>, { wrapper: enabled })
    lastProps(MockChip).onPressIn(mockEvent)
    expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(1)
  })

  it('fires notification on onLongPress (no event arg)', () => {
    const onLongPress = jest.fn()
    render(<Chip onLongPress={onLongPress}>{null}</Chip>, { wrapper: enabled })
    lastProps(MockChip).onLongPress()
    expect(mockedHaptics.notificationAsync).toHaveBeenCalledTimes(1)
  })
})

describe('FAB', () => {
  it('fires selection on onPress (no onPressIn exposed by Paper)', () => {
    const onPress = jest.fn()
    render(<FAB icon="plus" onPress={onPress} />, { wrapper: enabled })
    lastProps(MockFAB).onPress(mockEvent)
    expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(1)
    expect(onPress).toHaveBeenCalledWith(mockEvent)
  })
})

describe('Checkbox', () => {
  it('fires selection on onPress (no onPressIn exposed by Paper)', () => {
    const onPress = jest.fn()
    render(<Checkbox status="unchecked" onPress={onPress} />, { wrapper: enabled })
    lastProps(MockCheckbox).onPress(mockEvent)
    expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(1)
    expect(onPress).toHaveBeenCalledWith(mockEvent)
  })

  it('does not fire haptic when onPress is not provided', () => {
    render(<Checkbox status="unchecked" />, { wrapper: enabled })
    lastProps(MockCheckbox).onPress?.(mockEvent)
    expect(mockedHaptics.selectionAsync).not.toHaveBeenCalled()
  })
})

describe('Switch', () => {
  it('fires selection on onValueChange (no onPress/onPressIn: Switch is value-driven, not press-driven)', () => {
    const onValueChange = jest.fn()
    render(<Switch value={false} onValueChange={onValueChange} />, { wrapper: enabled })
    lastProps(MockSwitch).onValueChange(true)
    expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenCalledWith(true)
  })

  it('does not fire haptic when onValueChange is not provided', () => {
    render(<Switch value={false} />, { wrapper: enabled })
    lastProps(MockSwitch).onValueChange?.(true)
    expect(mockedHaptics.selectionAsync).not.toHaveBeenCalled()
  })
})

describe('SegmentedButtons', () => {
  it('fires selection on onValueChange (no onPress/onPressIn: each internal button is a private Paper implementation detail)', () => {
    const onValueChange = jest.fn()
    render(<SegmentedButtons value="a" onValueChange={onValueChange} buttons={[]} />, { wrapper: enabled })
    lastProps(MockSegmentedButtons).onValueChange('b')
    expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenCalledWith('b')
  })

  it('does not fire haptic when onValueChange is not provided', () => {
    render(<SegmentedButtons value="a" buttons={[]} />, { wrapper: enabled })
    lastProps(MockSegmentedButtons).onValueChange?.('b')
    expect(mockedHaptics.selectionAsync).not.toHaveBeenCalled()
  })
})
