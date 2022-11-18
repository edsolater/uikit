import { pipeHandlers } from '@edsolater/fnkit'
import { produce } from 'immer'
import { DivProps } from '../type'
import { createDataTag, hasTag } from './tag'

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
