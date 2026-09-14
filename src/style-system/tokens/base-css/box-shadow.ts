/** 盒阴影属性。 */
import { declaration, type Declaration } from '../../core/css-declaration'
import { key } from '../../core/css-key'
import type { Value } from '../../core/css-value'

export const boxShadowKey = key('box-shadow')
export const boxShadow = (value: Value): Declaration<'box-shadow'> => declaration(boxShadowKey, value)
