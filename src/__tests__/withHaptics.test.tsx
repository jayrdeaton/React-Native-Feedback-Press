import { render } from '@testing-library/react'
import * as haptics from 'expo-haptics'
import React from 'react'

import { HapticPressProvider } from '../HapticPressProvider'
import { withHaptics } from '../withHaptics'

const mockedHaptics = haptics as jest.Mocked<typeof haptics>

const mockEvent = {} as never

const enabled = ({ children }: { children: React.ReactNode }) => <HapticPressProvider initialValue={{ vibrate: true }}>{children}</HapticPressProvider>

const disabled = ({ children }: { children: React.ReactNode }) => <HapticPressProvider initialValue={{ vibrate: false }}>{children}</HapticPressProvider>

const lastProps = (mock: jest.Mock) => mock.mock.calls[mock.mock.calls.length - 1][0]

beforeEach(() => jest.clearAllMocks())

// A stand-in for "some component from a library this package doesn't ship a wrapper for":
// withHaptics is meant to work on exactly this kind of arbitrary component.
type FakeButtonProps = { onLongPress?: () => void; onPress?: () => void; onPressIn?: () => void }
const FakeButton = Object.assign(jest.fn((_props: FakeButtonProps) => null), { displayName: 'FakeButton' })

type FakeSwitchProps = { onValueChange?: (value: boolean) => void; value: boolean }
const FakeSwitch = jest.fn((_props: FakeSwitchProps) => null)

describe('withHaptics: default wiring', () => {
  const HapticFakeButton = withHaptics(FakeButton)

  it('fires selection on onPressIn when the component is interactive', () => {
    render(<HapticFakeButton onPress={jest.fn()} />, { wrapper: enabled })
    lastProps(FakeButton).onPressIn(mockEvent)
    expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(1)
  })

  it('does not fire when the component has no onPress/onLongPress', () => {
    render(<HapticFakeButton />, { wrapper: enabled })
    lastProps(FakeButton).onPressIn?.(mockEvent)
    expect(mockedHaptics.selectionAsync).not.toHaveBeenCalled()
  })

  it('fires notification on onLongPress', () => {
    const onLongPress = jest.fn()
    render(<HapticFakeButton onLongPress={onLongPress} />, { wrapper: enabled })
    lastProps(FakeButton).onLongPress()
    expect(mockedHaptics.notificationAsync).toHaveBeenCalledTimes(1)
    expect(onLongPress).toHaveBeenCalled()
  })

  it('respects the provider’s enabled toggle', () => {
    render(<HapticFakeButton onPress={jest.fn()} />, { wrapper: disabled })
    lastProps(FakeButton).onPressIn(mockEvent)
    expect(mockedHaptics.selectionAsync).not.toHaveBeenCalled()
  })

  it('sets a descriptive displayName', () => {
    expect(HapticFakeButton.displayName).toBe('withHaptics(FakeButton)')
  })
})

describe('withHaptics: custom wiring', () => {
  const HapticFakeSwitch = withHaptics(FakeSwitch, { onValueChange: 'selection' })

  it('fires selection on the configured trigger prop instead of onPressIn/onLongPress', () => {
    const onValueChange = jest.fn()
    render(<HapticFakeSwitch onValueChange={onValueChange} value={false} />, { wrapper: enabled })
    lastProps(FakeSwitch).onValueChange(true)
    expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenCalledWith(true)
  })

  it('does not wire onPressIn/onLongPress when they are not part of the custom config', () => {
    render(<HapticFakeSwitch value={false} />, { wrapper: enabled })
    expect(lastProps(FakeSwitch).onPressIn).toBeUndefined()
  })
})
