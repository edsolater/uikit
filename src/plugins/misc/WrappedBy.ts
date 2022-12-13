import { createElement } from 'react'
import { Component } from '../../typings/tools'
import { createWrapperPlugin } from '../createPlugin'

/** render self node as first child of Wrapper */
export const WrappedBy = createWrapperPlugin(
  (node) =>
    <T>(ComponentConstructor: Component<T>, props?: T) =>
      createElement(ComponentConstructor as any, props ?? {}, node)
)
