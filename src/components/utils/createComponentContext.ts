import { assert } from '@edsolater/fnkit'
import produce from 'immer'
import React, { createContext, useContext, useState } from 'react'
import { DivChildNode } from '../../Div'
import { parseDivChildrenToReactNode } from '../../Div/utils/handleDivChildren'
import { ReactComponent } from '../../typings/tools'

type ComponentContextValue<Props> = {
  contextComponentProps?: Props
  contextComponentSet?: (setDraft: (state: Props) => void) => void
}

export function createComponentContext<Props extends Record<keyof any, any>>(
  defaultProps?: Props
): [
  component: ReactComponent<Props & { children?: DivChildNode }>,
  hook: () => ComponentContextValue<Props & { children?: DivChildNode }>
] {
  const context = createContext<ComponentContextValue<Props & { children?: DivChildNode }>>({
    contextComponentProps: defaultProps
  })

  const hook = () => {
    const { contextComponentProps, contextComponentSet } = useContext(context)
    assert(contextComponentProps, 'lack of Provider')
    assert(contextComponentSet, 'lack of Provider')
    return { contextComponentProps: contextComponentProps, contextComponentSet: contextComponentSet }
  }

  const Provider = (props: Props & { children?: DivChildNode }) => {
    const [store, innerSetStore] = useState(props)
    const setStore = (innerFn) => {
      innerSetStore((s) =>
        produce(s, (draft) => {
          innerFn(draft)
        })
      )
    }
    return React.createElement(
      context.Provider,
      { value: { contextComponentProps: store, contextComponentSet: setStore } },
      parseDivChildrenToReactNode(props.children)
    )
  }
  return [Provider, hook]
}
