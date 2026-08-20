import { defaultSoundSettings, type SoundSettings } from '../SoundSettingsContext'

// Hand-rolled slice: no @reduxjs/toolkit dependency. Action types and creator
// behavior match the previous createSlice implementation exactly, so this works
// with RTK stores, vanilla Redux, or any reducer-based state container.
type PayloadAction<P> = { payload: P; type: string }

const createAction = <P>(type: string) => {
  const actionCreator = (payload: P): PayloadAction<P> => ({ payload, type })
  actionCreator.type = type
  actionCreator.match = (action: { type: string }): action is PayloadAction<P> => action.type === type
  return actionCreator
}

const initialize = createAction<SoundSettings>('sound/initialize')
const setEnabled = createAction<boolean>('sound/setEnabled')

export const soundActions = { initialize, setEnabled }

export const soundReducer = (state: SoundSettings = defaultSoundSettings, action: { type: string }): SoundSettings => {
  if (initialize.match(action)) return action.payload
  if (setEnabled.match(action)) return { ...state, enabled: action.payload }
  return state
}
