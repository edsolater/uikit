import { isNumber, isObject, isString, MayFn, shakeUndefinedItem, shrinkToValue } from '@edsolater/fnkit'
import { ReactNode } from 'react'
import { DivProps } from '../Div'
import { ExtendsProps } from '../typings/tools'
import { addPropsToReactElement } from '../utils/react/addPropsToReactElement'
import { useKitProps } from './utils'

export type ForProps<T extends any> = ExtendsProps<
  {
    each: T[] | undefined
    getKey?: (item: T, idx: number) => string | number | undefined
    children?: (item: T, idx: number) => JSX.Element
    renderGap?: MayFn<ReactNode, [utils: { left: T; right: T; idx: number; totalCount: number }]> // FIXME
    renderGapWithBothEnds?: MayFn<
      ReactNode,
      [utils: { left: T | undefined; right: T | undefined; idx: number; totalCount: number }] // FIXME
    >
  },
  DivProps
>

export function For<T>(inputProps: ForProps<T>): JSX.Element {
  const [{ each, getKey: rawGetKey, children, renderGap, renderGapWithBothEnds }, divProps] = useKitProps(inputProps)

  const getKey = (item: T, idx: number) =>
    rawGetKey?.(item, idx) ?? (isString(item) || isNumber(item) ? item : isObject(item) && 'id' in item ? item.id : idx)

  const getGapElement = (item: T, itemIdx: number, items: T[]) => ({
    left:
      itemIdx == 0
        ? shrinkToValue(renderGapWithBothEnds, [{ left: undefined, right: item, idx: 0, totalCount: items.length + 1 }])
        : undefined,
    right:
      itemIdx !== items.length - 1 && renderGap
        ? shrinkToValue(renderGap, [
            { left: item, right: items[itemIdx + 1], idx: itemIdx, totalCount: items.length - 1 }
          ])
        : shrinkToValue(renderGapWithBothEnds, [
            { left: item, right: items[itemIdx + 1], idx: itemIdx + 1, totalCount: items.length + 1 }
          ])
  })

  const items =
    renderGap || renderGapWithBothEnds
      ? shakeUndefinedItem(
          (each?.flatMap((item, idx, items) => {
            const { left, right } = getGapElement(item, idx, items)
            return [
              left && addPropsToReactElement(left, { key: `${getKey(item, idx)}_l` }),
              addPropsToReactElement(children?.(item, idx), { key: getKey(item, idx) }),
              right && addPropsToReactElement(right, { key: `${getKey(item, idx)}_r` })
            ]
          }) as [left: ReactNode | undefined, node: ReactNode, right: ReactNode | undefined]) ?? []
        )
      : each?.map((item, idx) => addPropsToReactElement(children?.(item, idx), { key: getKey(item, idx) })) ?? []
  return <>{items}</>
}
