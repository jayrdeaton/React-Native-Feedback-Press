import { render } from '@testing-library/react'
import { Image as RNImage, Pressable as RNPressable, Switch as RNSwitch } from 'react-native'
import * as Paper from 'react-native-paper'
import React from 'react'

import { FeedbackPressProvider } from '../FeedbackPressProvider'
import { Button, Card, Chip, FAB, IconButton, SegmentedButtons, Switch, TouchableRipple } from '../index'
import type { PaperModuleShape } from '../PaperContext'

// react-native-paper is a genuinely optional injection - it's never auto-detected and never
// required. Every Paper-flavored wrapper renders a real, working plain-RN fallback when
// `paper` isn't passed to <FeedbackPressProvider>, instead of throwing. These tests cover both
// the fallback-when-omitted and resolves-through-when-injected paths for a representative
// set of components (a simple press component, the trickiest structural one, and the two
// components whose fallback isn't Pressable-based).
const mockPaper = Paper as unknown as PaperModuleShape

const MockPressable = RNPressable as unknown as jest.Mock
const MockSwitch = RNSwitch as unknown as jest.Mock
const MockImage = RNImage as unknown as jest.Mock
const MockPaperButton = Paper.Button as unknown as jest.Mock
const MockPaperCard = Paper.Card as unknown as jest.Mock

const lastProps = (mock: jest.Mock) => mock.mock.calls[mock.mock.calls.length - 1][0]

const withPaper = ({ children }: { children: React.ReactNode }) => <FeedbackPressProvider paper={mockPaper}>{children}</FeedbackPressProvider>

const withoutPaper = ({ children }: { children: React.ReactNode }) => <FeedbackPressProvider>{children}</FeedbackPressProvider>

beforeEach(() => jest.clearAllMocks())

describe('Button', () => {
  it('renders the plain-RN fallback without paper injected', () => {
    const { container } = render(<Button onPress={jest.fn()}>Submit</Button>, { wrapper: withoutPaper })
    expect(MockPressable).toHaveBeenCalled()
    expect(MockPaperButton).not.toHaveBeenCalled()
    expect(container.textContent).toBe('Submit')
  })

  it('renders through to the injected Paper component when provided', () => {
    render(<Button onPress={jest.fn()}>Submit</Button>, { wrapper: withPaper })
    expect(MockPaperButton).toHaveBeenCalled()
    expect(MockPressable).not.toHaveBeenCalled()
  })

  // onPressOut/delayLongPress must reach the fallback Pressable, not just onPress/onLongPress -
  // useHoldToRepeat's onPressOut is what actually stops its repeat interval on release, so
  // dropping it here would leave that interval running forever in fallback mode. See FAB's own
  // equivalent test below for the first component this was caught on.
  it('forwards onPressOut and delayLongPress to the fallback Pressable, not just onPress/onLongPress', () => {
    const onPressOut = jest.fn()
    render(
      <Button onPress={jest.fn()} onLongPress={jest.fn()} onPressOut={onPressOut} delayLongPress={400}>
        Submit
      </Button>,
      { wrapper: withoutPaper }
    )

    expect(MockPressable).toHaveBeenCalled()
    const props = lastProps(MockPressable)
    expect(props.delayLongPress).toBe(400)

    props.onPressOut()
    expect(onPressOut).toHaveBeenCalledTimes(1)
  })
})

describe('Card', () => {
  it('renders a non-interactive fallback (plain View, not Pressable) with no onPress/onLongPress', () => {
    render(
      <Card>
        <Card.Content>Body</Card.Content>
      </Card>,
      { wrapper: withoutPaper }
    )
    expect(MockPressable).not.toHaveBeenCalled()
  })

  it('renders an interactive Pressable fallback when onPress is provided', () => {
    render(<Card onPress={jest.fn()}>{null}</Card>, { wrapper: withoutPaper })
    expect(MockPressable).toHaveBeenCalled()
  })

  // Same onPressOut/delayLongPress-forwarding gap as Button/FAB — see either's own comment.
  it('forwards onPressOut and delayLongPress to the fallback Pressable, not just onPress/onLongPress', () => {
    const onPressOut = jest.fn()
    render(
      <Card onPress={jest.fn()} onLongPress={jest.fn()} onPressOut={onPressOut} delayLongPress={400}>
        {null}
      </Card>,
      { wrapper: withoutPaper }
    )

    expect(MockPressable).toHaveBeenCalled()
    const props = lastProps(MockPressable)
    expect(props.delayLongPress).toBe(400)

    props.onPressOut()
    expect(onPressOut).toHaveBeenCalledTimes(1)
  })

  it('Content/Title/Actions/Cover all render a working fallback without paper injected', () => {
    const { container } = render(
      <Card onPress={jest.fn()}>
        <Card.Cover source={{ uri: 'https://example.com/cover.png' }} />
        <Card.Title subtitle="Subtitle" title="Title" />
        <Card.Content>Body</Card.Content>
        <Card.Actions>
          <Button onPress={jest.fn()}>OK</Button>
        </Card.Actions>
      </Card>,
      { wrapper: withoutPaper }
    )
    expect(MockImage).toHaveBeenCalled()
    expect(lastProps(MockImage).source).toEqual({ uri: 'https://example.com/cover.png' })
    expect(container.textContent).toContain('Title')
    expect(container.textContent).toContain('Subtitle')
    expect(container.textContent).toContain('Body')
    expect(container.textContent).toContain('OK')
  })

  it('Content/Title/Actions/Cover all resolve through the injected Paper module', () => {
    expect(() =>
      render(
        <Card>
          <Card.Cover source={{ uri: 'https://example.com/cover.png' }} />
          <Card.Title title="Title" />
          <Card.Content>Body</Card.Content>
          <Card.Actions>{null}</Card.Actions>
        </Card>,
        { wrapper: withPaper }
      )
    ).not.toThrow()
    expect(MockPaperCard).toHaveBeenCalled()
  })
})

describe('IconButton', () => {
  it('renders a fallback glyph derived from the icon prop without paper injected', () => {
    const { container } = render(<IconButton icon="star" onPress={jest.fn()} />, { wrapper: withoutPaper })
    expect(MockPressable).toHaveBeenCalled()
    expect(container.textContent).toBe('S')
  })

  // Same onPressOut/delayLongPress-forwarding gap as Button/FAB — see either's own comment.
  it('forwards onPressOut and delayLongPress to the fallback Pressable, not just onPress/onLongPress', () => {
    const onPressOut = jest.fn()
    render(<IconButton icon='star' onPress={jest.fn()} onLongPress={jest.fn()} onPressOut={onPressOut} delayLongPress={400} />, { wrapper: withoutPaper })

    expect(MockPressable).toHaveBeenCalled()
    const props = lastProps(MockPressable)
    expect(props.delayLongPress).toBe(400)

    props.onPressOut()
    expect(onPressOut).toHaveBeenCalledTimes(1)
  })
})

describe('Chip', () => {
  it('renders the plain-RN fallback without paper injected', () => {
    const { container } = render(<Chip onPress={jest.fn()}>Filter</Chip>, { wrapper: withoutPaper })
    expect(MockPressable).toHaveBeenCalled()
    expect(container.textContent).toBe('Filter')
  })

  // Same onPressOut/delayLongPress-forwarding gap as Button/FAB — see either's own comment.
  it('forwards onPressOut and delayLongPress to the fallback Pressable, not just onPress/onLongPress', () => {
    const onPressOut = jest.fn()
    render(
      <Chip onPress={jest.fn()} onLongPress={jest.fn()} onPressOut={onPressOut} delayLongPress={400}>
        Filter
      </Chip>,
      { wrapper: withoutPaper }
    )

    expect(MockPressable).toHaveBeenCalled()
    const props = lastProps(MockPressable)
    expect(props.delayLongPress).toBe(400)

    props.onPressOut()
    expect(onPressOut).toHaveBeenCalledTimes(1)
  })
})

describe('TouchableRipple', () => {
  it('renders the plain-RN fallback without paper injected', () => {
    const { container } = render(
      <TouchableRipple onPress={jest.fn()}>Ripple</TouchableRipple>,
      { wrapper: withoutPaper }
    )
    expect(MockPressable).toHaveBeenCalled()
    expect(container.textContent).toBe('Ripple')
  })

  // Same onPressOut/delayLongPress-forwarding gap as Button/FAB — see either's own comment.
  it('forwards onPressOut and delayLongPress to the fallback Pressable, not just onPress/onLongPress', () => {
    const onPressOut = jest.fn()
    render(
      <TouchableRipple onPress={jest.fn()} onLongPress={jest.fn()} onPressOut={onPressOut} delayLongPress={400}>
        Ripple
      </TouchableRipple>,
      { wrapper: withoutPaper }
    )

    expect(MockPressable).toHaveBeenCalled()
    const props = lastProps(MockPressable)
    expect(props.delayLongPress).toBe(400)

    props.onPressOut()
    expect(onPressOut).toHaveBeenCalledTimes(1)
  })
})

describe('FAB', () => {
  // onPressOut/delayLongPress must reach the fallback Pressable, not just onPress/onLongPress -
  // useHoldToRepeat's onPressOut is what actually stops its repeat interval on release, so
  // dropping it here would leave that interval running forever in fallback mode (see
  // useHoldToRepeat.test.tsx for the hook-level coverage; this is the FAB-forwarding half).
  it('forwards onPressOut and delayLongPress to the fallback Pressable, not just onPress/onLongPress', () => {
    const onPress = jest.fn()
    const onLongPress = jest.fn()
    const onPressOut = jest.fn()
    render(<FAB icon='plus' onPress={onPress} onLongPress={onLongPress} onPressOut={onPressOut} delayLongPress={400} />, { wrapper: withoutPaper })

    expect(MockPressable).toHaveBeenCalled()
    const props = lastProps(MockPressable)
    expect(props.delayLongPress).toBe(400)

    props.onPressOut()
    expect(onPressOut).toHaveBeenCalledTimes(1)
  })
})

describe('Switch', () => {
  it('falls back to react-native’s own core Switch without paper injected', () => {
    const onValueChange = jest.fn()
    render(<Switch onValueChange={onValueChange} value={false} />, { wrapper: withoutPaper })
    expect(MockSwitch).toHaveBeenCalled()
    expect(lastProps(MockSwitch).value).toBe(false)
    lastProps(MockSwitch).onValueChange(true)
    expect(onValueChange).toHaveBeenCalledWith(true)
  })
})

describe('SegmentedButtons', () => {
  it('renders one pressable segment per button without paper injected', () => {
    const onValueChange = jest.fn()
    const { container } = render(
      <SegmentedButtons buttons={[{ label: 'Day', value: 'day' }, { label: 'Week', value: 'week' }]} onValueChange={onValueChange} value="day" />,
      { wrapper: withoutPaper }
    )
    expect(MockPressable).toHaveBeenCalledTimes(2)
    expect(container.textContent).toContain('Day')
    expect(container.textContent).toContain('Week')
    lastProps(MockPressable).onPress()
    expect(onValueChange).toHaveBeenCalledWith('week')
  })
})
