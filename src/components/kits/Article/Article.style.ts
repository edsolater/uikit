/**
 * Article的正文内容边界。
 *
 * 只裁剪组件内部首尾块外边距，保留中间正文间距。
 *
 * 不改变裸article标签或其它容器的布局。
 */
import { rules } from '@/style-system'

rules('.Article', { 'margin-trim': 'block' })
