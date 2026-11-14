/**
 * Help 的独立帮助入口示例。
 *
 * 演示默认问号、可替换触发内容和结构化说明。
 *
 * 让使用者直接操作并观察帮助入口与说明的关系。
 */
import { Flow, Heading, Help, Text } from '../..'

/**
 * 展示不依附字段的问号入口，以及可替换的触发文字和模板说明。
 */
export function HelpExample() {
  return (
    <Flow>
      <Heading level={2}>Help · 补充说明</Heading>
      <Flow direction="row">
        <Text>悬停或聚焦问号查看帮助</Text>
        <Help
          name="统计口径说明"
          tooltip={
            <Flow>
              <Text p>成立率＝成立点数 ÷ 有效点数。</Text>
              <Text p>只统计双方都有数据的时间范围。</Text>
            </Flow>
          }
        />
      </Flow>
      <Flow direction="row">
        <Text>入口内容也可以替换</Text>
        <Help
          name="自定义入口说明"
          trigger="i"
          tooltip="说明入口可以独立用于任何需要补充解释的位置。"
        />
      </Flow>
    </Flow>
  )
}
