import { flap } from '@edsolater/fnkit'
import React, { ReactElement, ReactNode } from 'react'

type ReactComponent = (...params) => ReactElement | null
/**
 * @example
 * (props.children, _DrawerMask) => false // haven't this Component in children
 */
export default function isChildrenContain(children: ReactNode, targetComponent: string | ReactComponent): boolean {
  return flap(children).some((item) => React.isValidElement(item) && item.type === targetComponent)
}
