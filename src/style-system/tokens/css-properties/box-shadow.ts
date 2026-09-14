/** 盒阴影属性。 */
import { declaration, type Declaration } from '../../core/css-declaration'
import { key } from '../../core/css-key'
import { toValue, type Value } from '../../core/css-value'

export const boxShadowKey = key('box-shadow')
/** 盒阴影，可使用外阴影或内阴影。 */
export const boxShadow = (input: Value | string): Declaration<'box-shadow'> => declaration(boxShadowKey, toValue(input))
