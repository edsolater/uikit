import { flap } from '@edsolater/fnkit'
import React, { isValidElement, ReactElement } from 'react'
import { DivProps } from '../../Div'

export function mapElementChildren(
  children: DivProps['children'],
  mapper: (child: ReactElement, idx: number, totalCount: number) => DivProps['children']
): DivProps['children'][] {
  if (isFragnmentNode(children)) {
    return flap(React.cloneElement(children, { children: mapElementChildren(children.props.children, mapper) }))
  } else if (!children) {
    return []
  } else {
    return (React.Children.map(children, (child) => child) ?? []).map((child, idx, children) =>
      isValidElement(child) ? mapper(child, idx, React.Children.count(children)) : child
    )
  }
}

export function isFragnmentNode(node: DivProps['children']): node is ReactElement {
  return isValidElement(node) && node.type === React.Fragment
}
