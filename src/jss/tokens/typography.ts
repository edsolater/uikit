/** 提供组件共享的可覆盖字号。 */
import { token } from './token'

export const cssFontSize = {
  normal: token('font-size-md', '14px'),
  large: token('font-size-lg', '16px'),
  xlarge: token('font-size-xl', '20px'),
  heading: token('font-size-2xl', '24px'),
}
