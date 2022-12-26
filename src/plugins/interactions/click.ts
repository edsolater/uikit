import { isObject } from '@edsolater/fnkit'
import { useEffect, useRef } from 'react'
import { handleClick, HandleClickOptions } from '../../utils/dom/gesture/handleClick'
import { createICSS } from '../../styles'
import { createPlugin } from '../createPlugin'

export type ClickPluginOptions = HandleClickOptions & {
  applyCSSTo?: 'element-self' | 'element-before' | 'element-after'
}
/** used in user's use action */
export const click = createPlugin((arg: ClickPluginOptions) => {
  const options = arg

  const divRef = useRef<HTMLElement>()

  useEffect(() => {
    const subscription = handleClick(divRef.current, options)
    return subscription.cancel
  }, [divRef, ...Object.values(options)])

  const icss = createICSS([
    {
      cursor: 'pointer',
      '*': {
        cursor: 'inherit'
      }
    },
    options.applyCSSTo === 'element-after'
      ? {
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
      : options.applyCSSTo === 'element-before'
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
          ':hover': {
            backgroundImage: 'linear-gradiant(#00000008, #00000008)',
            filter: 'brightness(0.8)'
          },
          ':active': {
            backgroundImage: 'linear-gradiant(#0000001c, #0000001c)',
            filter: 'brightness(0.6)'
          }
        }
  ])
  return { domRef: divRef, icss }
})
