/**
 * Navigation 的命名导航区域示例。
 *
 * 组合两个真实页内链接与对应的章节内容。
 *
 * 让使用者区分区域地标和链接导航各自的职责。
 */
import { Flow, Heading, Navigation, Link, Text } from '@/components'
/**
 * 用章节链接定位同页内容，呈现具名导航区域。
 */
export function NavigationExample() {
  return (
    <Flow>
      <Navigation label="示例章节">
        <Link href="#navigation-purpose">用途</Link>
        <Link href="#navigation-boundary">边界</Link>
      </Navigation>
      <Heading level={3} id="navigation-purpose">
        用途
      </Heading>
      <Text>链接负责导航，区域负责表达这组链接的用途。</Text>
      <Heading level={3} id="navigation-boundary">
        边界
      </Heading>
      <Text>业务调用方决定链接内容与排列顺序。</Text>
    </Flow>
  )
}
