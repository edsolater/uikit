import { isObjectLike, isTruthy, shrinkFn, toArray, type MayArray, type MayFn, type Stringable } from '@edsolater/fnkit'

export type ClassName = Stringable | { [classname: string]: MayFn<boolean> }

export function classname(classNameArray: MayArray<ClassName>) {
  return toArray(classNameArray)
    .filter(isTruthy)
    .flatMap((classItem) =>
      isObjectLike(classItem)
        ? Object.entries(classItem).map(([classString, condition]) => shrinkFn(condition) && classString)
        : classItem,
    )
    .join(' ')
}
