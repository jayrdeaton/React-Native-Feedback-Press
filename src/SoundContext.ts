import { createContext } from 'react'

export type SoundConfig = {
  selection?: () => void
  notification?: () => void
}

export const SoundContext = createContext<SoundConfig>({})
