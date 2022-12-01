import { MayFn, shrinkToValue } from '@edsolater/fnkit'
import { cloneElement, isValidElement } from 'react'
import { ReactNode } from 'react'
import { mergeProps } from '../../Div/utils/mergeProps'

export function addPropsToReactElement<AvailableProps = Record<any, any>>(
  targetElement: ReactNode,
  additionalProps?: MayFn<Partial<AvailableProps> & { key?: number | string }, [oldprops: Partial<AvailableProps>]>
): ReactNode {
  if (!isValidElement(targetElement)) return targetElement
  return targetElement
    ? cloneElement(
        targetElement,
        mergeProps(targetElement.props, shrinkToValue(additionalProps, [targetElement.props as any]))
      )
    : null
}
