import { pipe } from '@edsolater/fnkit'
import { produce } from 'immer'
import { composeICSS } from '../../styles'
import { DivProps } from '../type'
import { createDataTag, hasTag, toDataset } from './tag'

export const noRenderTag = createDataTag({ key: 'Div', value: 'no-render' })
export const offscreenTag = createDataTag({ key: 'Div', value: 'offscreen' })

export function handleDivTag<P extends Partial<DivProps>>(props?: P): Omit<P, 'tag'> | undefined {
  if (!props?.tag) return props

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
        p.icss = composeICSS(p.icss, {
          position: 'absolute',
          top: -9999,
          left: -9999,
          pointerEvents: 'none',
          visibility: 'hidden'
        })
      })
    }
    return divProps
  }

  const processDataSet = (divProps: P | undefined) => {
    const tag = divProps?.tag
    if (!tag) return divProps
    return produce(divProps, (p) => {
      // @ts-ignore no need check
      p.htmlProps = [p.htmlProps, toDataset(tag)]
    })
  }

  return pipe(props, processDataSet, processNoRender, processOffscreen)
}
