import { isArray, isObject } from '@edsolater/fnkit'
import { ReactNode } from 'react'
import { DivProps } from '../type'

export function parseDivChildren(children: DivProps['children']): ReactNode {
  if (isObject(children) && Object.getOwnPropertySymbols(children).includes(Symbol.toPrimitive)) return String(children)
  return children as ReactNode
}
