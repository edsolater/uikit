import { addPropsToReactElement } from '../functions/react'
import { DivChildNode } from '../Div/type'
import { uikit } from './utils'

export interface ForProps<T extends any> {
  each: T[]
  getKey?: (item: T, idx: number) => string | number
  children?: (item: T, idx: number) => JSX.Element
}

export const For = uikit('For', (KitRoot) => <T extends any>(props: ForProps<T>) => (
  <KitRoot use='AddProps'>
    {props.each.map((item, idx) =>
      props.getKey
        ? addPropsToReactElement(props.children?.(item, idx), { key: props.getKey(item, idx) })
        : props.children?.(item, idx)
    )}
  </KitRoot>
))
