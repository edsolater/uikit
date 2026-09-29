/** 阴影 JSSKey。 */
import { key } from '../../key'

/**
 * 同址阴影声明使用默认逗号数组组合；组合值是否有效由浏览器判断。
 * @example
 * rules('.card', [[$boxShadow, '1px 2px red'], [$boxShadow, '3px 4px blue']])
 * compileCSS().includes('box-shadow: 1px 2px red, 3px 4px blue;') // true
 */
export const $boxShadow = key('box-shadow')
