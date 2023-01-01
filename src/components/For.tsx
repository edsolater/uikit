import { DivProps } from '../Div'
import { addPropsToReactElement } from '../utils/react/addPropsToReactElement'
import { createKit } from './utils'

export interface ForProps<T extends any> extends Omit<DivProps, 'children'> {
  each: T[]
  getKey?: (item: T, idx: number) => string | number
  children?: (item: T, idx: number) => JSX.Element
}

export const For = createKit('For', <T extends any>(props: ForProps<T>) =>
  props.each.map((item, idx) =>
    props.getKey
      ? addPropsToReactElement(props.children?.(item, idx), { key: props.getKey(item, idx) })
      : props.children?.(item, idx)
  )
)
