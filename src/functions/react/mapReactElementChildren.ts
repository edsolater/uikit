import { flap, shakeNil } from '@edsolater/fnkit'
import React, { isValidElement, ReactElement, ReactNode } from 'react'
export function mapElementChildren(
  children: ReactNode,
  mapper: (child: ReactElement, idx: number, children: readonly ReactNode[]) => ReactNode
): ReactNode[] {
  if (isFragnmentNode(children)) {
    return flap(React.cloneElement(children, { children: mapElementChildren(children.props.children, mapper) }))
  } else if (!children) {
    return []
  } else {
    return (React.Children.map(children, (child) => child) ?? []).map((child, idx, children) =>
      isValidElement(child) ? mapper(child, idx, children) : child
    )
  }
}

export function isFragnmentNode(node: ReactNode): node is ReactElement {
  return isValidElement(node) && node.type === React.Fragment
}
