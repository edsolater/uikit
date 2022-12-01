import { assert } from '@edsolater/fnkit'
import React, { createContext, FC, useContext } from 'react'
import { DivChildNode } from '../../Div'
import { parseDivChildren } from '../../Div/utils/handleDivChildren'

export function createComponentContext<Props extends { children?: DivChildNode }>(
  defaultProps?: Props
): readonly [FC<Props>, () => Props] {
  const context = createContext(defaultProps)
  const extractorHook = () => {
    const contextProp = useContext(context)
    assert(contextProp, 'lack of Provider')
    return contextProp
  }
  /** @Provider no need props!!  */
  const Provider = (props: Props) => {
    return React.createElement(context.Provider, { value: props }, parseDivChildren(props.children))
  }
  return [Provider, extractorHook]
}
