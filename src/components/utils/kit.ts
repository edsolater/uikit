/**
 * kit 是组件的统一创建入口。
 *
 * 根据固定配置自动接入身份标记、可选 Props 控制与实例集合。
 *
 * 共同接线由通用层承担，让组件函数集中表达自身业务。
 */
import {
  createComponent,
  createRenderEffect,
  onCleanup,
  type JSX,
} from '@/foundation'
import { getOwner, runWithOwner, untrack } from '@/foundation/reactivity'
import type { RefReceiver } from '@/hooks/createRef'
import type { Token } from '@/style-system'
import {
  ComponentMarker,
  type ComponentDescriptionProps,
  type ComponentMarkerProps,
} from '@/components/ComponentMarker/ComponentMarker'
import {
  createComponentPropsDirector,
  type DirectedProps,
  type PropsController,
  type PropsDefinition,
  type PropsDirectorOptions,
} from './componentPropsDirector'
import {
  createControllerRegistry,
  type ControllerCollection,
} from './controllerRegistry'

/** 每个实例的通用能力；函数已绑定实例作用域，可以直接解构。 */
export interface KitRenderContext {
  readonly name: string
  /** 将资源清理登记到当前组件实例，包括后续事件中创建的资源。 */
  readonly onCleanup: (cleanup: () => void) => void
}

/** 具体组件的业务函数：消费 Props 与可选能力，定义自身行为并返回界面。 */
export type KitCore<Props> = (
  props: Props,
  context: KitRenderContext,
) => JSX.Element

/** 固定的通用层配置；其中的工厂描述通用层如何取值，不承载组件业务流程。 */
export interface KitDefinition<
  Props,
  Definition extends PropsDefinition<Props>,
  Style = undefined,
> {
  name: string
  description?: ComponentDescriptionProps['description']
  availableProps: Definition
  marker?: (
    props: Props,
  ) => Pick<
    ComponentMarkerProps,
    'defaultDescriptionDisplay' | 'descriptionOnly'
  >
  directorOptions?: (input: Props) => PropsDirectorOptions<Props, Definition>
  styleTokens?: Style
}

export type KitComponent<Props, Controller, Style = undefined> = {
  (props: Props): JSX.Element
  readonly controllers: ControllerCollection<Controller, Style>
}

/** 完整字段协议必须保留原 Props 形状，并将 ref 排除于可写 Controller。 */
type ValidKitDefinition<
  Props,
  Definition extends PropsDefinition<Props>,
> = Definition extends { ref: 'only-through-prop' }
  ? Props extends { ref?: RefReceiver<PropsController<Props, Definition>> }
    ? DirectedProps<Props, Definition> extends Props
      ? unknown
      : never
    : never
  : never

/**
 * 创建可直接使用的组件与当前受控实例集合。
 * definition 声明供通用层消费的固定配置，core 定义具体组件自己的业务与渲染。
 * 代码按服务对象归属：Controller 注册、注销由 kit 自动处理；组件自身的资源由 core 管理。
 * onMount、onCleanup 只表达执行时机，不决定代码应放在哪个参数或哪一层。
 * 仅创建时有效的组件 ref 启用 Director；后续换接复用同一 Controller。
 */
export function kit<
  Props extends ComponentDescriptionProps & {
    ref?: RefReceiver<PropsController<Props, Definition>>
  },
  const Definition extends PropsDefinition<Props>,
  const Style extends Record<string, Token> | undefined = undefined,
>(
  definition: KitDefinition<Props, Definition, Style> &
    ValidKitDefinition<Props, Definition>,
  core: KitCore<Props>,
): KitComponent<Props, PropsController<Props, Definition>, Style> {
  const [controllers, registry] = createControllerRegistry<
    PropsController<Props, Definition>,
    Style
  >()
  if (definition.styleTokens) registry.addStyleTokens(definition.styleTokens)

  const Component = (input: Props) => {
    const owner = getOwner()
    const context: KitRenderContext = {
      name: definition.name,
      onCleanup: (cleanup) => runWithOwner(owner, () => onCleanup(cleanup)),
    }
    let props = input
    if (untrack(() => input.ref)) {
      const directed = createComponentPropsDirector(
        input,
        definition.availableProps,
        definition.directorOptions?.(input),
      )
      onCleanup(registry.register(directed.controller))
      createRenderEffect(
        () => input.ref,
        (receive) => receive?.(directed.controller),
      )
      // 入口已验证 DirectedProps 可赋给 Props；泛型函数体不能保留条件类型证明。
      props = directed.props as Props
    }
    const marker = definition.marker?.(props)
    return createComponent(ComponentMarker, {
      componentName: definition.name,
      get description() {
        return props.description
      },
      get descriptionDisplay() {
        return props.descriptionDisplay
      },
      get defaultDescription() {
        return definition.description
      },
      get defaultDescriptionDisplay() {
        return marker?.defaultDescriptionDisplay
      },
      get descriptionOnly() {
        return marker?.descriptionOnly
      },
      get children() {
        return createComponent(() => core(props, context), {})
      },
    })
  }
  return Object.assign(Component, { controllers })
}
