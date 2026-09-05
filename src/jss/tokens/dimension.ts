/** 定义间距、物体尺寸和边界厚度的可覆盖阶梯。 */
import { token } from './token'

export const cssSpace = {
  small: token('space-2', '4px'),
  normal: token('space-3', '8px'),
  medium: token('space-4', '12px'),
  large: token('space-5', '16px'),
  xlarge: token('space-6', '24px'),
  wide: token('space-7', '32px'),
  widest: token('space-8', '48px'),
}
export const cssSize = {
  small: token('size-3', '32px'),
  normal: token('size-5', '48px'),
  large: token('size-7', '64px'),
  xlarge: token('size-8', '80px'),
}
export const cssBoundary = { thin: token('boundary-1', '1px'), focus: token('boundary-2', '2px') }
