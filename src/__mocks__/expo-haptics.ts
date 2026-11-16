export const selectionAsync = jest.fn()
export const notificationAsync = jest.fn()
export const impactAsync = jest.fn()
export const performAndroidHapticsAsync = jest.fn(() => Promise.resolve())

export enum ImpactFeedbackStyle {
  Light = 'Light',
  Medium = 'Medium',
  Heavy = 'Heavy',
  Rigid = 'Rigid',
  Soft = 'Soft'
}

export enum NotificationFeedbackType {
  Success = 'Success',
  Warning = 'Warning',
  Error = 'Error'
}

export enum AndroidHaptics {
  Confirm = 'confirm',
  Reject = 'reject',
  Clock_Tick = 'clock-tick',
  Virtual_Key = 'virtual-key',
  Long_Press = 'long-press'
}
