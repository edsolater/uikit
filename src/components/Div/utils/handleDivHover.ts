import { useRef } from 'react'
import { useHover } from '@edsolater/hookit'
import { DivProps, HTMLTagMap } from '../type'
import produce from 'immer'

export function handleDivHover<TagName extends keyof HTMLTagMap = 'div'>(
  divProps?: DivProps<TagName> | undefined
): Omit<DivProps<TagName>, 'onHover' | 'onHoverStart' | 'onHoverEnd' | 'triggerDelay'> | undefined {
  if (!divProps) return

  // gesture handler (stable mergedProps)
  if ('onHover' in divProps || 'onHoverStart' in divProps || 'onHoverEnd' in divProps || 'triggerDelay' in divProps) {
    const divRef = useRef<HTMLTagMap[TagName]>(null)
    useHover(divRef, divProps)
    return produce(divProps, (props) => {
      // @ts-expect-error no deep type interface
      props.domRef = [props.domRef, divRef]
    })
  }

  return divProps
}
