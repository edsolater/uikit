import { isNumber, isString } from '@edsolater/fnkit'
import { DivProps } from '../Div'
import { addPropsToReactElement } from '../utils/react/addPropsToReactElement'
import { createKit } from './utils'

export interface ForProps<T extends any> extends Omit<DivProps, 'children'> {
  each: T[]
  getKey?: (item: T, idx: number) => string | number
  children?: (item: T, idx: number) => JSX.Element
}

export const For = createKit('For', <T extends any>(props: ForProps<T>) => {
  function spawnKey(item: T, idx: number) {
    return props.getKey ? props.getKey(item, idx) : isString(item) || isNumber(item) ? item : idx
  }
  return props.each.map((item, idx) =>
    addPropsToReactElement(props.children?.(item, idx), { key: spawnKey(item, idx) })
  )
})
