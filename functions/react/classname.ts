import type { MayDeepArray } from '../../typings/tools'
import isObjectLike from '@edsolater/fnkit/src/judgers/isObjectOrArray'
import isExist from '@edsolater/fnkit/src/judgers/isExist'
import flatMayArray from '@edsolater/fnkit/src/array/flatMayArray'

export type ClassName = any | { [classname: string]: boolean }
// <Div> 专用
export default function classname(classNameArray: MayDeepArray<ClassName>) {
  return toClassListString(classNameArray)
}

function toClassListString(classNameArray: MayDeepArray<ClassName>) {
  return flatMayArray([classNameArray])
    .filter(isExist)
    .flatMap((classItem) =>
      isObjectLike(classItem)
        ? Object.entries(classItem).map(([classString, condition]) => condition && classString)
        : classItem
    )
    .join(' ')
}
