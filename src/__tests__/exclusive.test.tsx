import { render } from '@testing-library/react'
import * as haptics from 'expo-haptics'
import { Platform, Pressable as RNPressable } from 'react-native'
import * as Paper from 'react-native-paper'
import React from 'react'

import { FeedbackPressProvider } from '../FeedbackPressProvider'
import { Button, Card, FAB, Pressable } from '../index'
import type { PaperModuleShape } from '../PaperContext'

const mockedHaptics = haptics as jest.Mocked<typeof haptics>
const mockPaper = Paper as unknown as PaperModuleShape

const MockButton = Paper.Button as unknown as jest.Mock
const MockCard = Paper.Card as unknown as jest.Mock
const MockFAB = Paper.FAB as unknown as jest.Mock
const MockPressable = RNPressable as unknown as jest.Mock

const mockEvent = {} as any

const enabled = ({ children }: { children: React.ReactNode }) => (
  <FeedbackPressProvider initialValue={{ vibrate: true }} paper={mockPaper}>
    {children}
  </FeedbackPressProvider>
)

const soundWrapper =
  (sound: { notification?: jest.Mock; selection?: jest.Mock }) =>
  ({ children }: { children: React.ReactNode }) => (
    <FeedbackPressProvider initialValue={{ vibrate: true }} paper={mockPaper} sound={sound}>
      {children}
    </FeedbackPressProvider>
  )

const lastProps = (mock: jest.Mock) => mock.mock.calls[mock.mock.calls.length - 1][0]

beforeEach(() => {
  jest.clearAllMocks()
  Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true })
})

describe('exclusive - Button (onPressIn-sourced selection normally)', () => {
  it('does not fire selection on onPressIn', () => {
    render(
      <Button exclusive onPress={jest.fn()}>
        {null}
      </Button>,
      { wrapper: enabled }
    )
    lastProps(MockButton).onPressIn?.(mockEvent)
    expect(mockedHaptics.selectionAsync).not.toHaveBeenCalled()
  })

  it('fires selection on onPressOut for a short press that never escalates', () => {
    render(
      <Button exclusive onPress={jest.fn()}>
        {null}
      </Button>,
      { wrapper: enabled }
    )
    lastProps(MockButton).onPressOut(mockEvent)
    expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(1)
    expect(mockedHaptics.notificationAsync).not.toHaveBeenCalled()
  })

  it('fires only notification, never selection, once onLongPress has escalated the press', () => {
    render(
      <Button exclusive onPress={jest.fn()} onLongPress={jest.fn()}>
        {null}
      </Button>,
      { wrapper: enabled }
    )
    lastProps(MockButton).onLongPress(mockEvent)
    lastProps(MockButton).onPressOut(mockEvent)
    expect(mockedHaptics.notificationAsync).toHaveBeenCalledTimes(1)
    expect(mockedHaptics.selectionAsync).not.toHaveBeenCalled()
  })

  it('resets after a completed long-press cycle - the next press fires selection again', () => {
    render(
      <Button exclusive onPress={jest.fn()} onLongPress={jest.fn()}>
        {null}
      </Button>,
      { wrapper: enabled }
    )
    lastProps(MockButton).onLongPress(mockEvent)
    lastProps(MockButton).onPressOut(mockEvent)
    expect(mockedHaptics.selectionAsync).not.toHaveBeenCalled()

    lastProps(MockButton).onPressOut(mockEvent)
    expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(1)
  })

  it('still calls the original onLongPress/onPressOut callbacks alongside the feedback', () => {
    const onLongPress = jest.fn()
    const onPressOut = jest.fn()
    render(
      <Button exclusive onPress={jest.fn()} onLongPress={onLongPress} onPressOut={onPressOut}>
        {null}
      </Button>,
      { wrapper: enabled }
    )
    lastProps(MockButton).onLongPress(mockEvent)
    expect(onLongPress).toHaveBeenCalledWith(mockEvent)
    lastProps(MockButton).onPressOut(mockEvent)
    expect(onPressOut).toHaveBeenCalledWith(mockEvent)
  })

  it('does not wire feedback at all when the element is not interactive', () => {
    render(<Button exclusive>{null}</Button>, { wrapper: enabled })
    lastProps(MockButton).onPressOut?.(mockEvent)
    expect(mockedHaptics.selectionAsync).not.toHaveBeenCalled()
    expect(mockedHaptics.notificationAsync).not.toHaveBeenCalled()
  })

  it('respects soundDisabled/hapticDisabled and per-instance sound overrides inside exclusive mode', () => {
    const mockSelectionSound = jest.fn()
    const mockNotificationSound = jest.fn()
    render(
      <Button exclusive onPress={jest.fn()} onLongPress={jest.fn()}>
        {null}
      </Button>,
      { wrapper: soundWrapper({ notification: mockNotificationSound, selection: mockSelectionSound }) }
    )
    lastProps(MockButton).onPressOut(mockEvent)
    expect(mockSelectionSound).toHaveBeenCalledTimes(1)
    expect(mockNotificationSound).not.toHaveBeenCalled()
  })

  it('leaves default (non-exclusive) behavior untouched when the prop is omitted', () => {
    render(<Button onPress={jest.fn()}>{null}</Button>, { wrapper: enabled })
    lastProps(MockButton).onPressIn(mockEvent)
    expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(1)
  })
})

describe('exclusive - Card (zero-arg onLongPress)', () => {
  it('fires selection on release, notification-only on a completed long-press, never both', () => {
    render(
      <Card exclusive onPress={jest.fn()} onLongPress={jest.fn()}>
        {null}
      </Card>,
      { wrapper: enabled }
    )
    lastProps(MockCard).onLongPress()
    lastProps(MockCard).onPressOut(mockEvent)
    expect(mockedHaptics.notificationAsync).toHaveBeenCalledTimes(1)
    expect(mockedHaptics.selectionAsync).not.toHaveBeenCalled()
  })

  it('fires selection for a short press with no long-press', () => {
    render(
      <Card exclusive onPress={jest.fn()} onLongPress={jest.fn()}>
        {null}
      </Card>,
      { wrapper: enabled }
    )
    lastProps(MockCard).onPressOut(mockEvent)
    expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(1)
    expect(mockedHaptics.notificationAsync).not.toHaveBeenCalled()
  })
})

describe('exclusive - FAB (onPress-sourced selection normally, no onPressIn)', () => {
  it('does not fire selection immediately on onPress', () => {
    render(<FAB exclusive icon="plus" onPress={jest.fn()} />, { wrapper: enabled })
    lastProps(MockFAB).onPress?.(mockEvent)
    expect(mockedHaptics.selectionAsync).not.toHaveBeenCalled()
  })

  it('fires selection on onPressOut for a short press', () => {
    render(<FAB exclusive icon="plus" onPress={jest.fn()} />, { wrapper: enabled })
    lastProps(MockFAB).onPressOut(mockEvent)
    expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(1)
  })

  it('fires only notification once onLongPress escalates, suppressing the later onPressOut selection', () => {
    render(<FAB exclusive icon="plus" onPress={jest.fn()} onLongPress={jest.fn()} />, { wrapper: enabled })
    lastProps(MockFAB).onLongPress(mockEvent)
    lastProps(MockFAB).onPressOut(mockEvent)
    expect(mockedHaptics.notificationAsync).toHaveBeenCalledTimes(1)
    expect(mockedHaptics.selectionAsync).not.toHaveBeenCalled()
  })
})

describe('exclusive - withFeedback consumers (native Pressable)', () => {
  it('works the same way for a plain native component wrapped via withFeedback', () => {
    render(
      <Pressable exclusive onPress={jest.fn()} onLongPress={jest.fn()}>
        {null}
      </Pressable>,
      { wrapper: enabled }
    )
    lastProps(MockPressable).onPressIn?.(mockEvent)
    expect(mockedHaptics.selectionAsync).not.toHaveBeenCalled()

    lastProps(MockPressable).onLongPress(mockEvent)
    lastProps(MockPressable).onPressOut(mockEvent)
    expect(mockedHaptics.notificationAsync).toHaveBeenCalledTimes(1)
    expect(mockedHaptics.selectionAsync).not.toHaveBeenCalled()
  })
})
