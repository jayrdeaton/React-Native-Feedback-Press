export const useAudioPlayer = jest.fn(() => ({
  play: jest.fn(),
  seekTo: jest.fn().mockResolvedValue(undefined),
  remove: jest.fn()
}))

export const createAudioPlayer = jest.fn(() => ({
  play: jest.fn(),
  seekTo: jest.fn().mockResolvedValue(undefined),
  remove: jest.fn()
}))

export const setAudioModeAsync = jest.fn().mockResolvedValue(undefined)
