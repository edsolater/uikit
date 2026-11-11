/**
 * 文档标题结构与内容定位组件的实现。
 */
import { kit, type KitController } from '@/components/tools/kit'
import type { RefReceiver } from '@/hooks/createRef'
import { headingPropsDefinition } from './Heading.prop'
import { onMount } from '@/foundation'
import type { ComponentDescriptionProps } from '@/components/tools/KitMarker/KitMarker'
import { Piv, type PivProps } from '@/components/Piv/Piv'
import './Heading.style'

type HeadingLevel = 1 | 2 | 3 | 4
type HeadingTag = `h${HeadingLevel}`

/** 标题层级必须显式提供；内容沿用Piv能力，id仅由最终渲染文字决定。 */
export type HeadingProps = Omit<PivProps<HeadingTag>, 'as' | 'id'> &
  ComponentDescriptionProps & {
    ref?: RefReceiver<HeadingController>
    level: HeadingLevel
  }

/** Heading 自有 Props 的指令式入口；ref 只从上游交付。 */
export type HeadingController = KitController<
  HeadingProps,
  typeof headingPropsDefinition
>

/**
 * Heading是H1至H4的结构与导航定位节点，不是自动Link。
 *
 * 四层限制用于保持结构可扫读。更细内容交给Text、列表或表格，不因字号或细节增加标题层级。
 *
 * | 层级 | 职能与例子 | 上／下 margin |
 * | --- | --- | --- |
 * | H1 | 整个页面或文档主题的总入口，例如“市场研究指南” | 2.4em／1.2em |
 * | H2 | 主要职责或领域分区，例如“数据准备” | 2em／1em |
 * | H3 | 可独立讨论的具体议题，例如“有效样本判定” | 1.6em／0.8em |
 * | H4 | 最小可定位引用子主题，例如“缺失值处理” | 1.4em／0.7em |
 *
 * 留白是标题上下外边距margin，不是padding；调用方可显式覆盖，块容器可裁剪自身首尾外边距。
 * 内容允许组合或动态更新，最终渲染文字同步为id，不接受另一份手写Heading ID。
 * 定位框只隐藏文字，保留内容、定位身份、排版与更新；链接行为由调用方的Link负责。
 */
export const Heading = kit(
  {
    name: 'Heading',
    availableProps: headingPropsDefinition,
    marker: () => ({ descriptionOnly: true }),
  },
  (props: HeadingProps) => {
    return (
      <Piv<HeadingTag>
        as={`h${props.level}`}
        shadowProps={props}
        class="Heading"
        domRef={(element) => {
          /**
           * 从真实文字取得定位身份，不预设children的组成或来源类型。
           */
          const syncId = () => {
            element.id = element.textContent ?? ''
          }
          const observer = new MutationObserver(syncId)
          observer.observe(element, {
            childList: true,
            subtree: true,
            characterData: true,
          })
          onMount(syncId)
          return () => observer.disconnect()
        }}
      >
        {props.children}
      </Piv>
    )
  },
)
