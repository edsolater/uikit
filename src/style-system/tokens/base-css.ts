/** 用 Property 定义基础属性，用 Block 组合相关属性。 */
import { block, type Block } from '../core/css-block'
import type { Value } from '../core/derive/css-value'
import { property, type Property } from '../core/derive/css-property'

/** 组合四个方向的外边距，值为单个长度、百分比或 auto。 */
export function margin(v: Value): Block {
  return block().attach(marginTop(v), marginRight(v), marginBottom(v), marginLeft(v))
}

/** 构造上外边距。 */
export function marginTop(v: Value): Property {
  return property('margin-top', v)
}

/** 构造右外边距。 */
export function marginRight(v: Value): Property {
  return property('margin-right', v)
}

/** 构造下外边距。 */
export function marginBottom(v: Value): Property {
  return property('margin-bottom', v)
}

/** 构造左外边距。 */
export function marginLeft(v: Value): Property {
  return property('margin-left', v)
}

/** 构造盒阴影。 */
export function boxShadow(v: Value): Property {
  return property('box-shadow', v)
}
