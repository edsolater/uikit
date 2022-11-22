import { flap, isObjectLike, isTruthy, MayDeepArray } from '@edsolater/fnkit'

export type ClassName = any | { [classname: string]: boolean }
// <Div> 专用
export default function classname(classNameArray: MayDeepArray<ClassName>) {
  return toClassListString(classNameArray)
}

function toClassListString(classNameArray: MayDeepArray<ClassName>) {
  return flap(classNameArray)
    .filter(isTruthy)
    .flatMap((classItem) =>
      isObjectLike(classItem)
        ? Object.entries(classItem).map(([classString, condition]) => condition && classString)
        : classItem
    )
    .join(' ')
}
