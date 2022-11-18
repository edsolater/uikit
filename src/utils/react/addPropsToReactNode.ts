import { cloneElement } from 'react';
import { ReactNode } from 'react';
import { mapElementChildren } from './mapReactElementChildren';
import { mergeProps } from './mergeProps';

export function addPropsToReactNode(node: ReactNode, props: any) {
  return mapElementChildren(node, (child) => cloneElement(child, mergeProps(props, child.props)));
}
