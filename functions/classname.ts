import { MayDeepArray } from '../typings/tools'
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

// it's bad, so i don't use
function mergeTailwindClasses(longClassName: string) {
  const splitedClassNames = longClassName // start: 'mr-2 m-2 p-4 m-4'
    .split(' ') // ['mr-2', 'm-2', 'p-4', 'm-4']
    .map((c) => c.split('-'))
    .map(([head, ...tail]) => [head, tail.join('-')]) // [['mr', '2'], ['m', '2'], ['p', '4'], ['m', '4']]
  const cleanClassNames = [...new Map(splitedClassNames as [string, string][])]
  // [['mr', '2'], ['p', '4'], ['m', '4']]
  const result = cleanClassNames.map((pair) => pair.join('-')).join(' ')
  // 'mr-2 p-4 m-4'
  return result
}
