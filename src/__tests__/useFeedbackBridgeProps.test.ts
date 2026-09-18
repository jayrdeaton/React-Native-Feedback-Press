import { renderHook } from '@testing-library/react'

import type { FeedbackBridgeProps } from '../useFeedbackBridgeProps'
import { useFeedbackBridgeProps } from '../useFeedbackBridgeProps'

describe('useFeedbackBridgeProps', () => {
  it('passes every field through unchanged, under its own FeedbackPressProviderProps name', () => {
    const onChange = jest.fn()
    const onSoundChange = jest.fn()
    const selection = jest.fn()
    const notification = jest.fn()
    const props: FeedbackBridgeProps = {
      initialValue: { vibrate: false },
      onChange,
      soundInitialValue: { enabled: false },
      onSoundChange,
      sound: { selection, notification }
    }

    const { result } = renderHook(() => useFeedbackBridgeProps(props))

    expect(result.current).toEqual(props)
  })

  it('is a safe no-op when every field is omitted', () => {
    const { result } = renderHook(() => useFeedbackBridgeProps({}))

    expect(result.current).toEqual({ initialValue: undefined, onChange: undefined, soundInitialValue: undefined, onSoundChange: undefined, sound: undefined })
  })

  it('returns a referentially stable object across re-renders when inputs are unchanged', () => {
    const onChange = jest.fn()
    const onSoundChange = jest.fn()
    const sound = { selection: jest.fn() }
    const props: FeedbackBridgeProps = { initialValue: { vibrate: true }, onChange, soundInitialValue: { enabled: true }, onSoundChange, sound }

    const { result, rerender } = renderHook((p: FeedbackBridgeProps) => useFeedbackBridgeProps(p), { initialProps: props })
    const first = result.current
    rerender(props)

    expect(result.current).toBe(first)
  })

  it('returns a new object once an input changes', () => {
    const onChange = jest.fn()
    const { result, rerender } = renderHook((p: FeedbackBridgeProps) => useFeedbackBridgeProps(p), { initialProps: { initialValue: { vibrate: true }, onChange } as FeedbackBridgeProps })
    const first = result.current

    rerender({ initialValue: { vibrate: false }, onChange })

    expect(result.current).not.toBe(first)
    expect(result.current.initialValue).toEqual({ vibrate: false })
  })
})
