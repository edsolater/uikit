import { createElement } from 'react'
import { Component } from '../typings/tools'
import { createWrapperPlugin } from './createPlugin'

/** render self node as first child of Wrapper */
export const WrappedBy = createWrapperPlugin(<T>(ComponentConstructor: Component<T>, props?: T) => {
  return (node) => createElement(ComponentConstructor as any, props ?? {}, node)
})
