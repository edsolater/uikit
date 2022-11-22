import { CSSProperties } from 'react'

/** e.g. #333 / rgba(255, 255, 255, 0.2) etc.*/
export type CSSColorString = string

export interface CSSStyle extends CSSProperties {
  [variable: `--${string}`]: string | number
}
