import { createDataTag, hasTag } from './tag'
import { DivProps, HTMLTagMap } from '../type'
import { produce } from 'immer'
import { AnyFn, pipeHandlers } from '@edsolater/fnkit'

export const noRenderTag = createDataTag({ key: 'Div', value: 'no-render' })
export const offscreenTag = createDataTag({ key: 'Div', value: 'offscreen' })

export function handleDivTag<P extends Partial<DivProps<any>>>(divProps?: P): Omit<P, 'tag'> | undefined {
  if (!divProps) return

  const processNoRender = (divProps: P | undefined) => {
    if (!divProps) return
    const hasNoRenderTag = hasTag(divProps.tag, noRenderTag)
    if (hasNoRenderTag) return undefined
    return divProps
  }

  const processOffscreen = (divProps: P | undefined) => {
    if (!divProps) return
    const hasOffscreenTag = hasTag(divProps.tag, offscreenTag)
    if (hasOffscreenTag) {
      return produce(divProps, (p) => {
        // @ts-ignore no need check
        p.icss = [
          p.icss,
          {
            position: 'absolute',
            top: -9999,
            left: -9999,
            pointerEvents: 'none',
            visibility: 'hidden'
          }
        ]
      })
    }
    return divProps
  }

  return pipeHandlers(divProps, processNoRender, processOffscreen)
}
