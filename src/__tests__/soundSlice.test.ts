import { defaultSoundSettings } from '../SoundSettingsContext'
import { soundActions, soundReducer } from '../redux/soundSlice'

describe('soundReducer', () => {
  it('returns default state when called with undefined', () => {
    const state = soundReducer(undefined, { type: '@@init' })
    expect(state).toEqual(defaultSoundSettings)
  })

  it('initialize replaces state entirely', () => {
    const state = soundReducer(undefined, soundActions.initialize({ enabled: false }))
    expect(state).toEqual({ enabled: false })
  })

  it('setEnabled sets enabled to false', () => {
    const state = soundReducer(undefined, soundActions.setEnabled(false))
    expect(state.enabled).toBe(false)
  })

  it('setEnabled sets enabled back to true', () => {
    const initial = soundReducer(undefined, soundActions.setEnabled(false))
    const state = soundReducer(initial, soundActions.setEnabled(true))
    expect(state.enabled).toBe(true)
  })

  it('setEnabled does not mutate other fields', () => {
    const state = soundReducer(undefined, soundActions.setEnabled(false))
    expect(Object.keys(state)).toEqual(Object.keys(defaultSoundSettings))
  })
})
