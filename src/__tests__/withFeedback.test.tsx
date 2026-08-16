import { render } from '@testing-library/react'
import * as haptics from 'expo-haptics'
import React from 'react'

import { FeedbackPressProvider } from '../FeedbackPressProvider'
import { withFeedback } from '../withFeedback'

const mockedHaptics = haptics as jest.Mocked<typeof haptics>

const mockEvent = {} as never

const enabled = ({ children }: { children: React.ReactNode }) => <FeedbackPressProvider initialValue={{ vibrate: true }}>{children}</FeedbackPressProvider>

const disabled = ({ children }: { children: React.ReactNode }) => <FeedbackPressProvider initialValue={{ vibrate: false }}>{children}</FeedbackPressProvider>

const lastProps = (mock: jest.Mock) => mock.mock.calls[mock.mock.calls.length - 1][0]

beforeEach(() => jest.clearAllMocks())

// A stand-in for "some component from a library this package doesn't ship a wrapper for":
// withFeedback is meant to work on exactly this kind of arbitrary component.
type FakeButtonProps = { onLongPress?: () => void; onPress?: () => void; onPressIn?: () => void }
const FakeButton = Object.assign(jest.fn((_props: FakeButtonProps) => null), { displayName: 'FakeButton' })

type FakeSwitchProps = { onValueChange?: (value: boolean) => void; value: boolean }
const FakeSwitch = jest.fn((_props: FakeSwitchProps) => null)

describe('withFeedback: default wiring', () => {
  const FeedbackFakeButton = withFeedback(FakeButton)

  it('fires selection on onPressIn when the component is interactive', () => {
    render(<FeedbackFakeButton onPress={jest.fn()} />, { wrapper: enabled })
    lastProps(FakeButton).onPressIn(mockEvent)
    expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(1)
  })

  it('does not fire when the component has no onPress/onLongPress', () => {
    render(<FeedbackFakeButton />, { wrapper: enabled })
    lastProps(FakeButton).onPressIn?.(mockEvent)
    expect(mockedHaptics.selectionAsync).not.toHaveBeenCalled()
  })

  it('fires notification on onLongPress', () => {
    const onLongPress = jest.fn()
    render(<FeedbackFakeButton onLongPress={onLongPress} />, { wrapper: enabled })
    lastProps(FakeButton).onLongPress()
    expect(mockedHaptics.notificationAsync).toHaveBeenCalledTimes(1)
    expect(onLongPress).toHaveBeenCalled()
  })

  it('respects the provider’s enabled toggle', () => {
    render(<FeedbackFakeButton onPress={jest.fn()} />, { wrapper: disabled })
    lastProps(FakeButton).onPressIn(mockEvent)
    expect(mockedHaptics.selectionAsync).not.toHaveBeenCalled()
  })

  it('sets a descriptive displayName', () => {
    expect(FeedbackFakeButton.displayName).toBe('withFeedback(FakeButton)')
  })
})

describe('withFeedback: custom wiring', () => {
  const FeedbackFakeSwitch = withFeedback(FakeSwitch, { onValueChange: 'selection' })

  it('fires selection on the configured trigger prop instead of onPressIn/onLongPress', () => {
    const onValueChange = jest.fn()
    render(<FeedbackFakeSwitch onValueChange={onValueChange} value={false} />, { wrapper: enabled })
    lastProps(FakeSwitch).onValueChange(true)
    expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenCalledWith(true)
  })

  it('does not wire onPressIn/onLongPress when they are not part of the custom config', () => {
    render(<FeedbackFakeSwitch value={false} />, { wrapper: enabled })
    expect(lastProps(FakeSwitch).onPressIn).toBeUndefined()
  })
})
