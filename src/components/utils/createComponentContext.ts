import { assert } from '@edsolater/fnkit'
import React, { createContext, FC, useContext } from 'react'
import { DivChildNode } from '../../Div'
import { parseDivChildren } from '../../Div/utils/handleDivChildren'

export function createComponentContext<Props extends Record<keyof any, any>>(
  defaultProps?: Props
): [component: FC<Props & { children: DivChildNode }>, hook: () => Props & { children?: DivChildNode }] {
  const context = createContext<(Props & { children?: DivChildNode }) | undefined>(defaultProps)
  const hook = () => {
    const contextProp = useContext(context)
    assert(contextProp, 'lack of Provider')
    return contextProp
  }
  /** @Provider no need props!!  */
  const Provider = (props: Props & { children: DivChildNode }) => {
    return React.createElement(context.Provider, { value: props }, parseDivChildren(props.children))
  }
  return [Provider, hook]
}
