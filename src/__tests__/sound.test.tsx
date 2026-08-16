import { render } from '@testing-library/react'
import * as haptics from 'expo-haptics'
import React from 'react'

import { FeedbackPressProvider } from '../FeedbackPressProvider'
import type { SoundConfig } from '../SoundContext'
import { withFeedback } from '../withFeedback'

const mockedHaptics = haptics as jest.Mocked<typeof haptics>

const mockEvent = {} as never

const lastProps = (mock: jest.Mock) => mock.mock.calls[mock.mock.calls.length - 1][0]

beforeEach(() => jest.clearAllMocks())

// A stand-in for "some component from a library this package doesn't ship a wrapper for":
// withFeedback is meant to work on exactly this kind of arbitrary component.
type FakeButtonProps = { onLongPress?: () => void; onPress?: () => void; onPressIn?: () => void; soundDisabled?: boolean; hapticDisabled?: boolean; sound?: SoundConfig }
const FakeButton = jest.fn((_props: FakeButtonProps) => null)

describe('sound feedback', () => {
  it('fires the selection sound callback alongside the selection haptic', () => {
    const mockSound = jest.fn()
    const FeedbackFakeButton = withFeedback(FakeButton)
    const wrapper = ({ children }: { children: React.ReactNode }) => <FeedbackPressProvider sound={{ selection: mockSound }}>{children}</FeedbackPressProvider>

    render(<FeedbackFakeButton onPress={jest.fn()} />, { wrapper })
    lastProps(FakeButton).onPressIn(mockEvent)

    expect(mockSound).toHaveBeenCalledTimes(1)
    expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(1)
  })

  it('fires the notification sound callback alongside the notification haptic', () => {
    const mockSound = jest.fn()
    const FeedbackFakeButton = withFeedback(FakeButton)
    const wrapper = ({ children }: { children: React.ReactNode }) => <FeedbackPressProvider sound={{ notification: mockSound }}>{children}</FeedbackPressProvider>

    render(<FeedbackFakeButton onLongPress={jest.fn()} />, { wrapper })
    lastProps(FakeButton).onLongPress()

    expect(mockSound).toHaveBeenCalledTimes(1)
    expect(mockedHaptics.notificationAsync).toHaveBeenCalledTimes(1)
  })

  it('soundDisabled suppresses the sound callback but not the haptic', () => {
    const mockSound = jest.fn()
    const FeedbackFakeButton = withFeedback(FakeButton)
    const wrapper = ({ children }: { children: React.ReactNode }) => <FeedbackPressProvider sound={{ selection: mockSound }}>{children}</FeedbackPressProvider>

    render(<FeedbackFakeButton onPress={jest.fn()} soundDisabled />, { wrapper })
    lastProps(FakeButton).onPressIn(mockEvent)

    expect(mockSound).not.toHaveBeenCalled()
    expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(1)
  })

  it('never leaks soundDisabled through to the underlying component props', () => {
    const mockSound = jest.fn()
    const FeedbackFakeButton = withFeedback(FakeButton)
    const wrapper = ({ children }: { children: React.ReactNode }) => <FeedbackPressProvider sound={{ selection: mockSound }}>{children}</FeedbackPressProvider>

    render(<FeedbackFakeButton onPress={jest.fn()} soundDisabled />, { wrapper })

    expect(lastProps(FakeButton).soundDisabled).toBeUndefined()
  })

  it('omitting sound entirely from the provider is a safe no-op: no throw, haptic still fires', () => {
    const FeedbackFakeButton = withFeedback(FakeButton)
    const wrapper = ({ children }: { children: React.ReactNode }) => <FeedbackPressProvider>{children}</FeedbackPressProvider>

    expect(() => render(<FeedbackFakeButton onPress={jest.fn()} />, { wrapper })).not.toThrow()
    expect(() => lastProps(FakeButton).onPressIn(mockEvent)).not.toThrow()
    expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(1)
  })

  it('hapticDisabled suppresses the haptic but not the sound - the independent counterpart to soundDisabled', () => {
    const mockSound = jest.fn()
    const FeedbackFakeButton = withFeedback(FakeButton)
    const wrapper = ({ children }: { children: React.ReactNode }) => <FeedbackPressProvider sound={{ selection: mockSound }}>{children}</FeedbackPressProvider>

    render(<FeedbackFakeButton onPress={jest.fn()} hapticDisabled />, { wrapper })
    lastProps(FakeButton).onPressIn(mockEvent)

    expect(mockedHaptics.selectionAsync).not.toHaveBeenCalled()
    expect(mockSound).toHaveBeenCalledTimes(1)
  })

  it('never leaks hapticDisabled through to the underlying component props', () => {
    const FeedbackFakeButton = withFeedback(FakeButton)
    const wrapper = ({ children }: { children: React.ReactNode }) => <FeedbackPressProvider>{children}</FeedbackPressProvider>

    render(<FeedbackFakeButton onPress={jest.fn()} hapticDisabled />, { wrapper })

    expect(lastProps(FakeButton).hapticDisabled).toBeUndefined()
  })

  it('a component instance can override the provider sound with its own, without touching the haptic', () => {
    const providerSound = jest.fn()
    const ownSound = jest.fn()
    const FeedbackFakeButton = withFeedback(FakeButton)
    const wrapper = ({ children }: { children: React.ReactNode }) => <FeedbackPressProvider sound={{ selection: providerSound }}>{children}</FeedbackPressProvider>

    render(<FeedbackFakeButton onPress={jest.fn()} sound={{ selection: ownSound }} />, { wrapper })
    lastProps(FakeButton).onPressIn(mockEvent)

    expect(ownSound).toHaveBeenCalledTimes(1)
    expect(providerSound).not.toHaveBeenCalled()
    expect(mockedHaptics.selectionAsync).toHaveBeenCalledTimes(1)
  })

  it('never leaks a per-instance sound override through to the underlying component props', () => {
    const FeedbackFakeButton = withFeedback(FakeButton)
    const wrapper = ({ children }: { children: React.ReactNode }) => <FeedbackPressProvider>{children}</FeedbackPressProvider>

    render(<FeedbackFakeButton onPress={jest.fn()} sound={{ selection: jest.fn() }} />, { wrapper })

    expect(lastProps(FakeButton).sound).toBeUndefined()
  })

  it('falls back to the provider sound when a component instance has no override of its own', () => {
    const providerSound = jest.fn()
    const FeedbackFakeButton = withFeedback(FakeButton)
    const wrapper = ({ children }: { children: React.ReactNode }) => <FeedbackPressProvider sound={{ selection: providerSound }}>{children}</FeedbackPressProvider>

    render(<FeedbackFakeButton onPress={jest.fn()} />, { wrapper })
    lastProps(FakeButton).onPressIn(mockEvent)

    expect(providerSound).toHaveBeenCalledTimes(1)
  })
})
