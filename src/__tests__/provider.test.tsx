import { act, renderHook } from '@testing-library/react'
import React from 'react'

import { FeedbackPressProvider } from '../FeedbackPressProvider'
import { useHapticSettings } from '../useHapticSettings'

describe('FeedbackPressProvider', () => {
  it('provides vibrate: true by default', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FeedbackPressProvider>{children}</FeedbackPressProvider>
    )
    const { result } = renderHook(() => useHapticSettings(), { wrapper })
    expect(result.current.settings.vibrate).toBe(true)
  })

  it('applies initialValue prop as initial settings', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FeedbackPressProvider initialValue={{ vibrate: false }}>{children}</FeedbackPressProvider>
    )
    const { result } = renderHook(() => useHapticSettings(), { wrapper })
    expect(result.current.settings.vibrate).toBe(false)
  })

  it('set updates settings in context', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FeedbackPressProvider>{children}</FeedbackPressProvider>
    )
    const { result } = renderHook(() => useHapticSettings(), { wrapper })
    act(() => { result.current.set({ vibrate: false }) })
    expect(result.current.settings.vibrate).toBe(false)
  })

  it('calls onChange when settings are updated via set', () => {
    const onChange = jest.fn()
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FeedbackPressProvider onChange={onChange}>{children}</FeedbackPressProvider>
    )
    const { result } = renderHook(() => useHapticSettings(), { wrapper })
    act(() => { result.current.set({ vibrate: false }) })
    expect(onChange).toHaveBeenCalledWith({ vibrate: false })
  })

  it('does not call onChange on initial render', () => {
    const onChange = jest.fn()
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FeedbackPressProvider onChange={onChange}>{children}</FeedbackPressProvider>
    )
    renderHook(() => useHapticSettings(), { wrapper })
    expect(onChange).not.toHaveBeenCalled()
  })
})
