import { isObject } from '@edsolater/fnkit'
import { handleClick, HandleClickOptions } from '../../../functions/dom/gesture/handleClick'
import { createCallbackRef } from '../../../hooks/useCallbackRef'
import { createICSS } from '../../../styles'
import { AbilityPlugin } from './type'

export type ClickPluginOptions = HandleClickOptions & {
  styleThrough: 'element-self' | 'element-before' | 'element-after'
}
/** used in user's use action */
export const click: {
  (options: ClickPluginOptions): AbilityPlugin
  (onClickCallback: HandleClickOptions['onClick'], options?: ClickPluginOptions): AbilityPlugin
} = (...args) => {
  const options: ClickPluginOptions = isObject(args[0])
    ? args[0]
    : { ...args[1], onClick: args[0], styleThrough: 'element-self' }

  const divRef = createCallbackRef<HTMLElement>((el) => {
    handleClick(el, options)
  })

  const icss = createICSS([
    {
      cursor: 'pointer',
      '*': {
        cursor: 'inherit'
      }
    },
    options.styleThrough === 'element-self'
      ? {
          ':hover': {
            background: '#00000008',
            filter: 'brightness(0.8)'
          },
          ':active': {
            background: '#0000001c',
            filter: 'brightness(0.6)'
          }
        }
      : options.styleThrough === 'element-before'
      ? {
          position: 'relative',
          '::before': {
            content: "''",
            position: 'absolute',
            inset: 0,
            ':hover': {
              background: '#00000008',
              filter: 'brightness(0.8)'
            },
            ':active': {
              background: '#0000001c',
              filter: 'brightness(0.6)'
            }
          }
        }
      : {
          position: 'relative',
          '::after': {
            content: "''",
            position: 'absolute',
            inset: 0,
            ':hover': {
              background: '#00000008',
              filter: 'brightness(0.8)'
            },
            ':active': {
              background: '#0000001c',
              filter: 'brightness(0.6)'
            }
          }
        }
  ])
  return { additionalProps: { domRef: divRef, icss } } as AbilityPlugin
}
