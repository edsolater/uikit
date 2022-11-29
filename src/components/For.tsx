import { addPropsToReactElement } from '../functions/react'
import { DivChildNode } from '../Div/type'
import { createUikit } from './utils'

export interface ForProps<T extends any> {
  each: T[]
  getKey?: (item: T, idx: number) => string | number
  children?: (item: T, idx: number) => JSX.Element
}

export const For = createUikit('For', <T extends any>(props: ForProps<T>) =>
  props.each.map((item, idx) =>
    props.getKey
      ? addPropsToReactElement(props.children?.(item, idx), { key: props.getKey(item, idx) })
      : props.children?.(item, idx)
  )
)
