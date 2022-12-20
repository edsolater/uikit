import { createElement } from 'react'
import { Component } from '../../typings/tools'
import { createWrapperPluginFn } from '../createPlugin'

/** render self node as first child of Wrapper */
export const WrappedBy = createWrapperPluginFn(
  (node) =>
    <T>(ComponentConstructor: Component<T>, props?: T) =>
      createElement(ComponentConstructor as any, props ?? {}, node)
)
