import { useHover } from '@edsolater/hookit'
import produce from 'immer'
import { useRef } from 'react'
import { DivProps } from '../type'

export function handleDivHover<P extends Partial<DivProps<any>>>(
  divProps?: P
): Omit<P, 'onHover' | 'onHoverStart' | 'onHoverEnd' | 'triggerDelay'> | undefined {
  if (!divProps) return

  // gesture handler (stable mergedProps)
  if ('onHover' in divProps || 'onHoverStart' in divProps || 'onHoverEnd' in divProps || 'triggerDelay' in divProps) {
    const divRef = useRef<any>(null)
    useHover(divRef, divProps)
    return produce(divProps, (props) => {
      // @ts-ignore no deep type interface
      props.domRef = [props.domRef, divRef]
    })
  }

  return divProps
}
