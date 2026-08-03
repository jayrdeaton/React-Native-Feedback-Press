const stub = (props: Record<string, unknown>) => null

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
