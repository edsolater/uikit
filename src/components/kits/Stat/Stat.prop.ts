/** Stat 的内容与高度策略。 */
import type { JSX, Source } from '@/foundation'
import {
  kitPropDefinition,
  type KitController,
  type KitProps,
} from '../../tools/kit'

export const componentName = 'Stat'

export type StatProps = KitProps<{
  controller: StatController
  domTag: 'div'
}> & {
  children?: JSX.Element
  /** 按当前内容收放，空内容可收至零高。 */
  fitContent?: Source<boolean | undefined>
}

export const statPropDefinition = {
  ...kitPropDefinition,
  fitContent: 'source',
  children: 'tracked-value',
} as const

export interface StatController extends KitController<{
  props: StatProps
  propDefinition: typeof statPropDefinition
}> {}
