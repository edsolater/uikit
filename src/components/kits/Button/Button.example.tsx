/**
 * Button 的本地 Example。
 * 它只服务本地 HTML 验证，不参与组件库正式导出。
 */
import { allButton, Button, type ButtonController } from './Button'
import { createRef } from '@/hooks/createRef'
import { createDomRef } from '@/hooks/createDomRef'
import { Card } from '../Card/Card'
import { Article } from '../Article/Article'
import { ComponentMarkerStructureViewTrigger } from '@/components/ComponentMarker/ComponentMarkerStructureViewTrigger'
import { Text } from '@/components/kits/Text/Text'
import { Heading } from '@/components/kits/Heading/Heading'

export function ButtonExample() {
  const [button, receiveButton] = createRef<ButtonController>()
  const [buttonElement, receiveButtonElement] =
    createDomRef<HTMLButtonElement>()
  return (
    <>
      <Article as={Card} class="example-card" description="按钮外观与状态示例">
        <div class="example-card-head">
          <Text description="类别">Component</Text>
          <Heading level={2} description="标题">
            Button
          </Heading>
        </div>
        <Text p description="描述">
          按钮分别描述填充、轮廓或无边界外观、整体强调程度、动作语气和尺寸，不承载导航语义。
        </Text>

        <div class="button-row">
          <Button ref={receiveButton} domRef={receiveButtonElement}>
            被控制的按钮
          </Button>
          <Button onClick={() => button.setStatus?.('loading', true)}>
            此按钮加载
          </Button>
          <Button onClick={() => buttonElement.focus?.()}>聚焦此按钮</Button>
          <Button
            onClick={() => {
              allButton.setStatus('loading', true)
            }}
          >
            全部加载
          </Button>
          <Button
            onClick={() => {
              allButton.setStatus('loading', false)
            }}
          >
            结束全部加载
          </Button>
        </div>

        <div class="button-example-grid">
          <Text block class="button-example-head" description="列标题">
            类型
          </Text>
          <Text block class="button-example-head" description="列标题">
            默认
          </Text>
          <Text block class="button-example-head" description="列标题">
            悬停体验
          </Text>
          <Text block class="button-example-head" description="列标题">
            按下体验
          </Text>
          <Text block class="button-example-head" description="列标题">
            流程
          </Text>

          <Text block class="button-example-label" description="行标题">
            普通
          </Text>
          <div>
            <Button>Default</Button>
          </div>
          <div>
            <Button>Default</Button>
          </div>
          <div>
            <Button>Default</Button>
          </div>
          <div class="button-row">
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
          </div>

          <Text block class="button-example-label" description="行标题">
            filled 外观
          </Text>
          <div>
            <Button filled>Filled</Button>
          </div>
          <div>
            <Button filled>Filled</Button>
          </div>
          <div>
            <Button filled>Filled</Button>
          </div>
          <div class="button-row">
            <Button filled loading>
              Loading
            </Button>
            <Button filled disabled>
              Disabled
            </Button>
          </div>

          <Text block class="button-example-label" description="行标题">
            较强强调
          </Text>
          <div>
            <Button strong filled>
              强调
            </Button>
          </div>
          <div>
            <Button strong filled>
              强调
            </Button>
          </div>
          <div>
            <Button strong filled>
              强调
            </Button>
          </div>
          <div class="button-row">
            <Button strong filled loading>
              处理中
            </Button>
            <Button strong filled disabled>
              禁用
            </Button>
          </div>

          <Text block class="button-example-label" description="行标题">
            危险
          </Text>
          <div>
            <Button danger filled>
              Danger
            </Button>
          </div>
          <div>
            <Button danger filled>
              Danger
            </Button>
          </div>
          <div>
            <Button danger filled>
              Danger
            </Button>
          </div>
          <div class="button-row">
            <Button danger filled loading>
              Loading
            </Button>
            <Button danger filled disabled>
              Disabled
            </Button>
          </div>

          <Text block class="button-example-label" description="行标题">
            plain 外观
          </Text>
          <div>
            <Button plain>Plain</Button>
          </div>
          <div>
            <Button plain>Plain</Button>
          </div>
          <div>
            <Button plain>Plain</Button>
          </div>
          <div class="button-row">
            <Button plain danger>
              移除
            </Button>
            <Button plain loading>
              Loading
            </Button>
            <Button plain disabled>
              Disabled
            </Button>
          </div>
        </div>

        <div class="button-size-stack">
          <Text block class="button-example-label" description="分组标题">
            尺寸
          </Text>
          <div class="button-row">
            <Button small>Small</Button>
            <Button>Medium</Button>
            <Button large>Large</Button>
            <Button xlarge>XLarge</Button>
          </div>
          <div class="button-row">
            <Button small filled>
              Small
            </Button>
            <Button filled>Medium</Button>
            <Button large filled>
              Large
            </Button>
            <Button xlarge filled>
              XLarge
            </Button>
          </div>
        </div>
      </Article>
      <ComponentMarkerStructureViewTrigger />
    </>
  )
}
