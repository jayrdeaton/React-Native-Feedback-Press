import { render } from '@testing-library/react'
import * as haptics from 'expo-haptics'
import { Platform, Pressable as RNPressable, TouchableHighlight as RNTouchableHighlight, TouchableOpacity as RNTouchableOpacity } from 'react-native'
import React from 'react'

import { FeedbackPressProvider } from '../FeedbackPressProvider'
import { Pressable, TouchableHighlight, TouchableOpacity } from '../index'

const mockedHaptics = haptics as jest.Mocked<typeof haptics>
const MockPressable = RNPressable as unknown as jest.Mock
const MockTouchableOpacity = RNTouchableOpacity as unknown as jest.Mock
const MockTouchableHighlight = RNTouchableHighlight as unknown as jest.Mock

const mockEvent = {} as any

const enabled = ({ children }: { children: React.ReactNode }) => (
  <FeedbackPressProvider initialValue={{ vibrate: true }}>{children}</FeedbackPressProvider>
)

const disabled = ({ children }: { children: React.ReactNode }) => (
  <FeedbackPressProvider initialValue={{ vibrate: false }}>{children}</FeedbackPressProvider>
)

const lastProps = (mock: jest.Mock) => mock.mock.calls[mock.mock.calls.length - 1][0]

beforeEach(() => {
  jest.clearAllMocks()
  Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true })
})

describe('Pressable', () => {
  it('fires selection on onPressIn when onPress is provided', () => {
    render(<Pressable onPress={jest.fn()}>{null}</Pressable>, { wrapper: enabled })
    lastProps(MockPressable).onPressIn(mockEvent)
    expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(1)
  })

  it('does not fire haptic on onPressIn when not interactive', () => {
    render(<Pressable>{null}</Pressable>, { wrapper: enabled })
    lastProps(MockPressable).onPressIn?.(mockEvent)
    expect(mockedHaptics.selectionAsync).not.toHaveBeenCalled()
  })

  it('calls the original onPressIn alongside the haptic', () => {
    const onPressIn = jest.fn()
    render(<Pressable onPress={jest.fn()} onPressIn={onPressIn}>{null}</Pressable>, { wrapper: enabled })
    lastProps(MockPressable).onPressIn(mockEvent)
    expect(onPressIn).toHaveBeenCalledWith(mockEvent)
  })

  it('fires notification on onLongPress', () => {
    const onLongPress = jest.fn()
    render(<Pressable onLongPress={onLongPress}>{null}</Pressable>, { wrapper: enabled })
    lastProps(MockPressable).onLongPress(mockEvent)
    expect(mockedHaptics.notificationAsync).toHaveBeenCalledTimes(1)
    expect(onLongPress).toHaveBeenCalledWith(mockEvent)
  })

  it('treats element as interactive when only onLongPress is provided', () => {
    render(<Pressable onLongPress={jest.fn()}>{null}</Pressable>, { wrapper: enabled })
    lastProps(MockPressable).onPressIn(mockEvent)
    expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(1)
  })

  it('does not fire haptics when provider is disabled', () => {
    render(<Pressable onPress={jest.fn()}>{null}</Pressable>, { wrapper: disabled })
    lastProps(MockPressable).onPressIn(mockEvent)
    expect(mockedHaptics.selectionAsync).not.toHaveBeenCalled()
  })
})

describe('TouchableOpacity', () => {
  it('fires selection on onPressIn when onPress is provided', () => {
    render(<TouchableOpacity onPress={jest.fn()}>{null}</TouchableOpacity>, { wrapper: enabled })
    lastProps(MockTouchableOpacity).onPressIn(mockEvent)
    expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(1)
  })

  it('does not fire haptic when not interactive', () => {
    render(<TouchableOpacity>{null}</TouchableOpacity>, { wrapper: enabled })
    lastProps(MockTouchableOpacity).onPressIn?.(mockEvent)
    expect(mockedHaptics.selectionAsync).not.toHaveBeenCalled()
  })

  it('fires notification on onLongPress', () => {
    const onLongPress = jest.fn()
    render(<TouchableOpacity onLongPress={onLongPress}>{null}</TouchableOpacity>, { wrapper: enabled })
    lastProps(MockTouchableOpacity).onLongPress(mockEvent)
    expect(mockedHaptics.notificationAsync).toHaveBeenCalledTimes(1)
    expect(onLongPress).toHaveBeenCalledWith(mockEvent)
  })

  it('does not fire haptics when provider is disabled', () => {
    render(<TouchableOpacity onPress={jest.fn()}>{null}</TouchableOpacity>, { wrapper: disabled })
    lastProps(MockTouchableOpacity).onPressIn(mockEvent)
    expect(mockedHaptics.selectionAsync).not.toHaveBeenCalled()
  })
})

describe('TouchableHighlight', () => {
  it('fires selection on onPressIn when onPress is provided', () => {
    render(<TouchableHighlight onPress={jest.fn()}>{null}</TouchableHighlight>, { wrapper: enabled })
    lastProps(MockTouchableHighlight).onPressIn(mockEvent)
    expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(1)
  })

  it('does not fire haptic when not interactive', () => {
    render(<TouchableHighlight>{null}</TouchableHighlight>, { wrapper: enabled })
    lastProps(MockTouchableHighlight).onPressIn?.(mockEvent)
    expect(mockedHaptics.selectionAsync).not.toHaveBeenCalled()
  })

  it('fires notification on onLongPress', () => {
    const onLongPress = jest.fn()
    render(<TouchableHighlight onLongPress={onLongPress}>{null}</TouchableHighlight>, { wrapper: enabled })
    lastProps(MockTouchableHighlight).onLongPress(mockEvent)
    expect(mockedHaptics.notificationAsync).toHaveBeenCalledTimes(1)
    expect(onLongPress).toHaveBeenCalledWith(mockEvent)
  })

  it('does not fire haptics when provider is disabled', () => {
    render(<TouchableHighlight onPress={jest.fn()}>{null}</TouchableHighlight>, { wrapper: disabled })
    lastProps(MockTouchableHighlight).onPressIn(mockEvent)
    expect(mockedHaptics.selectionAsync).not.toHaveBeenCalled()
  })
})
