const stub = (_props: Record<string, unknown>) => null
// Portal.Host wraps FeedbackPressProvider's own children (see its own comment) - a stub that
// returns null the way every other leaf mock here does would unmount the whole tree under test,
// so this one has to actually render what it's given instead.
const passthrough = ({ children }: { children?: unknown }) => children

// Capture props so tests can inspect what handlers were wired
export const Button = jest.fn(stub)
export const IconButton = jest.fn(stub)
export const TouchableRipple = jest.fn(stub)
export const Card = Object.assign(jest.fn(stub), {
  Content: jest.fn(stub),
  Title: jest.fn(stub),
  Actions: jest.fn(stub),
  Cover: jest.fn(stub)
})
export const Chip = jest.fn(stub)
export const FAB = jest.fn(stub)
export const Checkbox = jest.fn(stub)
export const Switch = jest.fn(stub)
export const SegmentedButtons = jest.fn(stub)
export const Appbar = {
  BackAction: jest.fn(stub),
  Action: jest.fn(stub)
}
export const Portal = Object.assign(jest.fn(passthrough), {
  Host: jest.fn(passthrough)
})
