import { cloneElement } from 'react'
import { ReactNode } from 'react'
import { mergeProps } from '../../Div/utils/mergeProps'
import { mapElementChildren } from './mapReactElementChildren'

export function addPropsToReactNode(node: ReactNode, props: any) {
  return mapElementChildren(node, (child) => cloneElement(child, mergeProps(props, child.props)))
}
