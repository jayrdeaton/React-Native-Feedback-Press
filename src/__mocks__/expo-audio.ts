export const useAudioPlayer = jest.fn(() => ({
  play: jest.fn(),
  seekTo: jest.fn().mockResolvedValue(undefined),
  remove: jest.fn()
}))

// volume, loop and shouldCorrectPitch are plain properties on the returned object: a test reads
// what the hook last assigned.
export const createAudioPlayer = jest.fn(() => ({
  play: jest.fn(),
  pause: jest.fn(),
  seekTo: jest.fn().mockResolvedValue(undefined),
  setPlaybackRate: jest.fn(),
  remove: jest.fn(),
  addListener: jest.fn(() => ({ remove: jest.fn() }))
}))

export const setAudioModeAsync = jest.fn().mockResolvedValue(undefined)
