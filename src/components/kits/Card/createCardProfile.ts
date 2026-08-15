import type { Source } from '../../../hooks'
import { createPivPlugin } from '../../Piv/plugin/helpers'

export type CardTone = 'soft' | 'solid'
export type CardSize = 'small' | 'large' | 'xlarge'

export interface CardProfileProps {
  tone?: CardTone
  size?: Source<CardSize | undefined>
}

/** 把 Card 的视觉声量和物理尺度翻译成稳定 DOM 画像。 */
export function createCardProfile(props: CardProfileProps) {
  const plugin = createPivPlugin(() => ({
    htmlProps: {
      'data-tone': props.tone,
      'data-size': props.size,
    },
  }))

  return { plugin }
}
