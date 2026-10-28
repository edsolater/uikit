/**
 * Link 的原生导航示例。
 *
 * 展示当前链接和另开页面的真实目标。
 *
 * 让使用者验证链接行为，不把卡片外观误当导航能力。
 */
import { Flow, Heading, Link, Text } from '@/components'
/**
 * 展示当前页标记与另开页面的链接行为。
 */
export function LinkExample() {
  return (
    <Flow>
      <Link href="#link-target" current>
        当前示例章节
      </Link>
      <Link href="https://example.com" newTab>
        在新页面打开示例网站
      </Link>
      <Heading level={3} id="link-target">
        链接目标
      </Heading>
      <Text>链接内容由调用方组合，不自带卡片皮肤。</Text>
    </Flow>
  )
}
