import { assert, overwriteFunctionName, pipe, shrinkToValue, uncapitalize } from '@edsolater/fnkit'
import React, { createContext, useContext, useState } from 'react'
import { DivChildNode } from '../../Div'
import { parseDivChildrenToReactNode } from '../../Div/utils/handleDivChildren'
import { ReactComponent } from '../../typings/tools'

type ComponentContextValue<Props extends Record<keyof any, any>> = {
  value: Props
  set: React.Dispatch<React.SetStateAction<Props>>
}

export function createComponentContext<Props extends Record<keyof any, any>>(
  defaultProps: Props
): [
  component: ReactComponent<Props & { children?: DivChildNode }>,
  hook: () => ComponentContextValue<Props & { children?: DivChildNode }>,
  propertyHooks: {
    [key in keyof Props as `use${Capitalize<key & string>}`]: () => ComponentContextValue<Props[key]>
  }
] {
  const context = createContext<ComponentContextValue<Props & { children?: DivChildNode }>>({
    value: defaultProps,
    set: () => {
      throw 'lack of Provider'
    }
  })

  const hook = () => {
    const { value, set } = useContext(context)
    assert(value, 'lack of Provider')
    assert(set, 'lack of Provider')
    return { value, set }
  }
  const propertyHooks = new Proxy(
    {},
    {
      get(target, p) {
        const propertyName = pipe(String(p), (s) => s.match(/use(?<property>.*)/)?.groups?.property ?? '', uncapitalize)
        return overwriteFunctionName(() => {
          const { value: contextValue, set: contextSet } = useContext(context)
          assert(contextValue, 'lack of Provider')
          assert(contextSet, 'lack of Provider')
          return {
            value: contextValue[propertyName],
            //@ts-ignore
            set: (dispatcher) => contextSet((s) => ({ [propertyName]: shrinkToValue(dispatcher, [s]) }))
          }
        }, String(p))
      }
    }
  )

  const Provider = (props: Props & { children?: DivChildNode }) => {
    const [store, setStore] = useState(props)
    return React.createElement(
      context.Provider,
      { value: { value: store, set: setStore } },
      parseDivChildrenToReactNode(props.children)
    )
  }
  return [Provider, hook, propertyHooks as any]
}
