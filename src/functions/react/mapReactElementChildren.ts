import React, { isValidElement, ReactElement, ReactNode } from 'react'
export function mapElementChildren(children: ReactNode, mapper: (child: ReactElement, idx: number) => ReactNode) {
  if (isFragnmentNode(children)) {
    return React.cloneElement(children, { children: mapElementChildren(children.props.children, mapper) })
  } else {
    return React.Children.map(children, (child: ReactNode, idx) => (isValidElement(child) ? mapper(child, idx) : child))
  }
}

export function isFragnmentNode(node: ReactNode): node is ReactElement {
  return isValidElement(node) && node.type === React.Fragment
}
