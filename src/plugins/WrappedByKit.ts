import { createElement } from 'react'
import { Component } from '../typings/tools'
import { createWrapperPlugin } from './createPlugin'

/** render self node as first child of Wrapper */
export const WrappedByKit = createWrapperPlugin(<T>(ComponentConstructor: Component<T>, props?: T) => {
  // @ts-expect-error no need check type
  return (node) => wrapperCreator(createElement(ComponentConstructor, props ?? {}, node))
})
