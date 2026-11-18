/**
 * 为一次 Kit 调用准备渲染、Controller 和结构查看使用的 Props。
 *
 * 统一处理补充声明、样式配置与可选的字段控制。
 *
 * 组件核心拿到可直接使用的 Props，无需自行组合这些步骤。
 */
import type { PivProps } from '../Piv/Piv'
import type { ComponentIdentityMarkerDisplayProps } from './ComponentIdentityMarker/ComponentIdentityMarker'
import {
  createVariantInputRules,
  type VariantPropsGroup,
} from '../kits/utils/parseVariantProps'
import { pivPropAccumulation } from '../Piv/plugin/mergePivProps'
import {
  createPropsController,
  type PropsDefinition,
  type PropsControllerOptions,
} from './propDefinition'
import { parseStyleConfigProps } from './parseStyleConfigProps'
import { createPropsDeclaration } from './propsDeclaration/shadowProps'

/** 组件定义中的输入规则，以及此实例是否提供 Controller。 */
interface ComponentPropsOptions<
  Props extends object,
  Definition extends PropsDefinition<Props>,
> {
  propDefinition: Definition
  variantGroups?: readonly Pick<VariantPropsGroup, 'groupName' | 'candidates'>[]
  $styleConfig?: object
  /** 由 Kit 创建时的 ref 决定，之后增删 ref 不切换本实例的模式。 */
  enableController: boolean
}

/**
 * 按组件定义处理本次原始 Props，保留补充来源与属性的持续更新。
 * props 供核心读取；启用控制时，controllerProps 提供 states 中的可写 State，否则为 undefined。
 * markerProps 以惰性 getter 提供 label 和 descriptionDisplay，结构查看不会开始字段使用。
 * 定义了样式解释器时，样式配置留在本层解释，不再自动交给下层重复处理。
 */
export function prepareComponentProps<
  Props extends ComponentIdentityMarkerDisplayProps & Pick<PivProps, 'label'>,
  Definition extends PropsDefinition<Props>,
>(rawProps: Props, options: ComponentPropsOptions<Props, Definition>) {
  // 合并补充声明，再将样式快捷字段归入配置。
  const declarations = createPropsDeclaration(rawProps, {
    accumulate: pivPropAccumulation,
  })
  const normalizedProps = parseStyleConfigProps(declarations.resolvedProps)

  // 按创建时的选择启用控制，并配对处理 Variant 缺省分组与候选隐藏。
  const propsController = options.enableController
    ? createPropsController(normalizedProps, options.propDefinition, {
        declaration: declarations,
        ...(options.variantGroups
          ? createVariantInputRules(options.variantGroups, normalizedProps)
          : {}),
      } as PropsControllerOptions<Props, Definition>)
    : undefined

  // 先接回处理后的 shadowProps/is，使 Controller 的修改也能参与合并。
  const finalProps = propsController?.props ?? normalizedProps
  declarations.connectSupplementalProps(finalProps)
  // 包装核心读取，在之后取字段时登记使用，供后续组件接收尚未使用的声明。
  const props = declarations.markUsedOnRead(finalProps)
  if (options.$styleConfig) declarations.claim('$styleConfig')

  // 结构查看只在需要时取显示字段，不占用核心尚未使用的字段。
  const markerProps = {
    get label() {
      return propsController
        ? propsController.readProp('label')
        : normalizedProps.label
    },
    get descriptionDisplay() {
      return propsController
        ? propsController.readProp('descriptionDisplay')
        : normalizedProps.descriptionDisplay
    },
  }

  return { props, controllerProps: propsController?.states, markerProps }
}
