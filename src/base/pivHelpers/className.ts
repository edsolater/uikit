import { isObjectLike, isTruthy, shrinkFn, toArray, type Booleanable, type Stringable } from '@edsolater/fnkit'
import type { Accessable, AccessablePropValueWrapper } from '../type'

export type ClassName = Stringable | { [classname: string]: Accessable<Booleanable> }
export type PivClassNameProp = AccessablePropValueWrapper<ClassName>

/**
 * TODO: className 需要支持 细粒度class订阅(使用createEffect)， 以及条件 class（对象形式）， 还要支持
 */
export function classname(classNameArray: PivClassNameProp): string {
  const newClassName = toArray(classNameArray)
    .filter(isTruthy)
    .flatMap((classItem) =>
      isObjectLike(classItem)
        ? Object.entries(classItem).map(([classString, condition]) => shrinkFn(condition) && classString)
        : classItem,
    )
    .join(' ')
  return newClassName
}
