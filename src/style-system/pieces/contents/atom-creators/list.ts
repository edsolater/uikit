/** 用 Value 装配逗号与空格分隔的内容。 */
import { arraySequenceToCSSString, value, type ValueData } from '../../../value'

/** 逗号分隔内容；沿用 Value 的默认数组输出。 */
export function valueList(...items: ValueData[]) {
  return value(items)
}

/** 空格分隔内容。 */
export function valueSequence(...items: ValueData[]) {
  return value(items, { toCSSString: arraySequenceToCSSString })
}
