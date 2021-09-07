import React, { ReactElement, ReactNode } from 'react'
import flatMayArray from '@edsolater/fnkit/src/array/flatMayArray'

type ReactComponent = (...params) => ReactElement | null
/**
 * @example
 * (props.children, _DrawerMask) => false // haven't this Component in children
 */
export default function isChildrenContain(
  children: ReactNode,
  targetComponent: string | ReactComponent
): boolean {
  return flatMayArray([children]).some(
    (item) => React.isValidElement(item) && item.type === targetComponent
  )
}
