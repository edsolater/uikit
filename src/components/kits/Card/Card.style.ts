/**
 * Card的默认块排版与内容边界。
 *
 * 裁剪自身首尾块外边距，内部排列由调用方组合Flow或Grid。
 *
 * 复用Board材质，不重复定义背景、padding或边界。
 */
import { rules } from '@/style-system'

rules('.Card', { 'display': 'flow-root', 'margin-trim': 'block' })
