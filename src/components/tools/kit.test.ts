/**
 * Kit 公共与自有协议验证。
 *
 * 验证完整字段事实、覆盖模式和声明优先的业务能力约束。
 *
 * 不依赖组件实现反推公开输入或控制器。
 */
import { expect, expectTypeOf, test } from 'vitest'
import { createState, type State } from '@/foundation'
import {
  kit,
  kitPropDefinition,
  type KitPropDefinition,
  type KitProps,
  type KitController,
  type KitComponent,
  type KitControllerProps,
  type KitOptions,
  type KitOptionsConfig,
  type ControllerRegistry,
} from '@/index'
import {
  type FlowProps,
  type FlowController,
  type FlowPropDefinition,
  flowPropDefinition,
} from '../kits/Flow/Flow.prop'
import { Flow } from '../kits/Flow/Flow'
import { Table } from '../kits/Table/Table'
import { Grid } from '../kits/Grid/Grid'
import { Button } from '../kits/Button/Button'
import type { ButtonProps, ButtonController } from '../kits/Button/Button.prop'
import { buttonPropDefinition } from '../kits/Button/Button.prop'
import { flowStyleConfig, type FlowStyleConfig } from '../kits/Flow/Flow.style'
import * as buttonStyle from '../kits/Button/Button.style'
import {
  helpPropDefinition,
  type HelpProps,
  type HelpController,
} from '../kits/Help/Help.prop'
import {
  numericPropDefinition,
  type NumericProps,
  type NumericController,
} from '../kits/Numeric/Numeric.prop'
import {
  percentPropDefinition,
  type PercentProps,
  type PercentController,
} from '../kits/Percent/Percent.prop'
import {
  selectPropDefinition,
  type SelectProps,
  type SelectController,
} from '../kits/Select/Select.prop'
import {
  selectInputPropDefinition,
  type SelectInputProps,
  type SelectInputController,
} from '../kits/SelectInput/SelectInput.prop'
import {
  tablePropDefinition,
  type TableProps,
  type TableController,
} from '../kits/Table/Table.prop'
import {
  inputPropDefinition,
  type InputProps,
  type InputController,
} from '../kits/Input/Input.prop'
import {
  inputRangePropDefinition,
  type InputRangeProps,
  type InputRangeController,
} from '../kits/InputRange/InputRange.prop'
import {
  textAreaPropDefinition,
  type TextAreaProps,
  type TextAreaController,
} from '../kits/TextArea/TextArea.prop'

const { buttonStyleConfig, ...buttonTokens } = buttonStyle

/**
 * 具名角色独立选用，缺省保持公共契约；可选属性仍保留其声明的值域。
 */
function verifyNamedAggregateContracts() {
  expectTypeOf<KitProps>().toEqualTypeOf<KitProps<{}>>()
  expectTypeOf<KitProps['ref']>().toEqualTypeOf<
    KitControllerProps<{ props: object }>['ref']
  >()
  expectTypeOf<
    KitProps<{
      domTag?: undefined
      controller?: undefined
      $styleConfig?: undefined
    }>
  >().toEqualTypeOf<KitProps>()
  interface NamedRoles {
    domTag?: 'button'
    controller?: FlowController
    $styleConfig?: FlowStyleConfig
  }
  const named: KitProps<NamedRoles> = {
    as: 'button',
    $styleConfig: { $direction: 'row' },
  }
  expectTypeOf<KitProps<NamedRoles>['ref']>().toEqualTypeOf<FlowProps['ref']>()
  type ButtonInput = KitProps<{ domTag?: 'button' }>
  const button: ButtonInput = { as: 'button' }
  // @ts-expect-error 命名的可选标签声明仍限制原生标签。
  const wrongTag: ButtonInput = { as: 'div' }
  type NamedStyle = KitProps<{ $styleConfig?: FlowStyleConfig }>
  const styled: NamedStyle = { $styleConfig: { $direction: 'row' } }
  // @ts-expect-error 样式角色独立选择后仍校验字段值域。
  const wrongStyle: NamedStyle = { $styleConfig: { $direction: 'diagonal' } }
  type NamedController = KitProps<{ controller?: FlowController }>
  expectTypeOf<NamedController['ref']>().toEqualTypeOf<FlowProps['ref']>()
  interface NamedOptions extends KitOptionsConfig<FlowProps> {
    propDefinition: FlowPropDefinition
    $styleTokens?: typeof buttonTokens
  }
  const options: KitOptions<NamedOptions> = {
    name: 'Flow',
    propDefinition: flowPropDefinition,
    $styleTokens: buttonTokens,
  }
  expectTypeOf<
    ControllerRegistry<{
      controller: FlowController
      $styleTokens?: typeof buttonTokens
    }>
  >().toEqualTypeOf<
    | ControllerRegistry<{ controller: FlowController }>
    | ControllerRegistry<{
        controller: FlowController
        $styleTokens: typeof buttonTokens
      }>
  >()
  expectTypeOf<
    ControllerRegistry<{ controller: FlowController }>
  >().not.toHaveProperty('style')
  expectTypeOf<
    ControllerRegistry<{ controller: FlowController; $styleTokens: undefined }>
  >().not.toHaveProperty('style')
  // 这里只声明集合角色，不额外收窄原有调用输入与集合成员的值域。
  type PrimitiveComponent = KitComponent<{ props: string; controller: number }>
  expectTypeOf<Parameters<PrimitiveComponent>[0]>().toEqualTypeOf<string>()
  type PrimitiveRegistry = ControllerRegistry<{ controller: number }>
  // @ts-expect-error 组件契约必须声明控制器角色。
  type MissingComponentController = KitComponent<{ props: FlowProps }>
  // @ts-expect-error 创建契约必须声明字段协议。
  type MissingOptionsDefinition = KitOptions<{ props: FlowProps }>
  // @ts-expect-error 控制协议必须声明字段协议。
  type MissingControllerDefinition = KitController<{ props: FlowProps }>
  // @ts-expect-error 集合契约必须声明实例成员。
  type MissingRegistryController = ControllerRegistry<{}>
  // @ts-expect-error 已改为具名配置，不保留旧位置参数。
  type PositionalProps = KitProps<{}, FlowController>
  void [named, button, wrongTag, styled, wrongStyle, options]
}
void verifyNamedAggregateContracts

/**
 * 空样式契约保留统一对象入口；undefined 表示清空，原始值不作为配置。
 */
function verifyEmptyStyleContract() {
  const objectConfig: InputProps = { $styleConfig: { $gap: '2rem' } }
  // @ts-expect-error 空配置也不能作为底层 CSS 字符串入口。
  const cssText: InputRangeProps = { $styleConfig: 'color: red' }
  const empty: InputProps = { $styleConfig: {} }
  const absent: InputProps = { $styleConfig: undefined }
  interface NamedConfig {
    $gap?: string
  }
  const named: NamedConfig = { $gap: '2rem' }
  const namedInput: InputProps = { $styleConfig: named }
  const sourceInput: InputProps = { $styleConfig: createState(named) }
  void [objectConfig, cssText, empty, absent, namedInput, sourceInput]
}
void verifyEmptyStyleContract

/**
 * 样式别名只扩充公开调用输入，不改变业务 Props、字段协议或 Controller。
 */
function verifyStyleConfigInputProps() {
  type FlowInput = Parameters<typeof Flow>[0]
  const direct: FlowInput = {
    $direction: createState<'row' | 'column'>('column'),
    $gap: '2rem',
    $grow: false,
    $styleConfig: { $direction: 'row' },
  }
  // @ts-expect-error 方向别名沿用配置值域。
  const wrongDirection: FlowInput = { $direction: 'diagonal' }
  // @ts-expect-error 未声明的配置字段不会成为任意样式输入。
  const wrongField: FlowInput = { $unknown: 'value' }
  // @ts-expect-error Button 未声明方向样式字段。
  const empty: Parameters<typeof Button>[0] = { $direction: 'column' }
  expectTypeOf<FlowProps>().not.toHaveProperty('$direction')
  expectTypeOf<FlowController['props']>().not.toHaveProperty('$direction')
  expectTypeOf<FlowController['props']>().toHaveProperty('$styleConfig')
  expectTypeOf<FlowController['props']>().not.toHaveProperty('styleConfig')
  // @ts-expect-error Flow 整组配置入口也使用美元前缀。
  const oldFlow: FlowInput = { styleConfig: { direction: 'column' } }
  // @ts-expect-error Flow 配置中的字段与直接属性同名。
  const oldFlowDirection: FlowInput = { $styleConfig: { direction: 'column' } }
  // @ts-expect-error Flow 已有美元字段不能再次添加美元符号。
  const doubledFlow: FlowInput = { $$direction: 'column' }
  type ButtonInput = Parameters<typeof Button>[0]
  const button: ButtonInput = { $gap: '1rem', $styleConfig: { $gap: '2rem' } }
  // @ts-expect-error Button 的整体配置入口也使用美元前缀。
  const oldButton: ButtonInput = { styleConfig: { gap: '1rem' } }
  // @ts-expect-error 整组配置的字段与直接属性同名。
  const oldGap: ButtonInput = { $styleConfig: { gap: '1rem' } }
  // @ts-expect-error 已有美元字段不能再添加第二个美元符号。
  const doubledGap: ButtonInput = { $$gap: '1rem' }
  // @ts-expect-error 样式字段仍保持字符串值域。
  const numericGap: ButtonInput = { $gap: 12 }
  type GridInput = Parameters<typeof Grid>[0]
  const grid: GridInput = { $columns: 3, $responsive: false }
  // @ts-expect-error Grid 不再接收普通配置容器。
  const oldGrid: GridInput = { styleConfig: { columns: 3 } }
  // @ts-expect-error Grid 配置对象的字段也使用美元前缀。
  const oldGridColumns: GridInput = { $styleConfig: { columns: 3 } }
  expectTypeOf<ButtonController['props']>().toHaveProperty('$styleConfig')
  expectTypeOf<ButtonController['props']>().not.toHaveProperty('styleConfig')
  Table<{ name: string }>({
    data: [{ name: '甲' }],
    $columnMinWidths: { name: 120 },
  })
  Table<{ name: string }>({
    data: [{ name: '甲' }],
    // @ts-expect-error 泛型表格别名保留列键关系。
    $columnMinWidths: { missing: 120 },
  })
  Table<{ name: string }>({
    data: [{ name: '甲' }],
    // @ts-expect-error 泛型 Table 不再接收普通配置容器。
    styleConfig: { columnMinWidths: { name: 120 } },
  })
  void [
    direct,
    wrongDirection,
    wrongField,
    empty,
    button,
    oldButton,
    oldGap,
    doubledGap,
    numericGap,
    oldFlow,
    oldFlowDirection,
    doubledFlow,
    grid,
    oldGrid,
    oldGridColumns,
  ]
}
void verifyStyleConfigInputProps

test('各组件保留统一children输入与控制字段，不按当前业务呈现裁剪协议', () => {
  expectTypeOf<HelpProps>().toHaveProperty('children')
  expectTypeOf<HelpController['props']>().toHaveProperty('children')
  expectTypeOf<NumericProps>().toHaveProperty('children')
  expectTypeOf<NumericController['props']>().toHaveProperty('children')
  expectTypeOf<PercentProps>().toHaveProperty('children')
  expectTypeOf<PercentController['props']>().toHaveProperty('children')
  expectTypeOf<SelectProps>().toHaveProperty('children')
  expectTypeOf<SelectController['props']>().toHaveProperty('children')
  expectTypeOf<SelectInputProps>().toHaveProperty('children')
  expectTypeOf<SelectInputController['props']>().toHaveProperty('children')
  expectTypeOf<TableProps>().toHaveProperty('children')
  expectTypeOf<TableController['props']>().toHaveProperty('children')
  expectTypeOf<InputProps>().toHaveProperty('children')
  expectTypeOf<InputController['props']>().toHaveProperty('children')
  expectTypeOf<InputRangeProps>().toHaveProperty('children')
  expectTypeOf<InputRangeController['props']>().toHaveProperty('children')
  expectTypeOf<TextAreaProps>().toHaveProperty('children')
  expectTypeOf<TextAreaController['props']>().toHaveProperty('children')
  for (const definition of [
    helpPropDefinition,
    numericPropDefinition,
    percentPropDefinition,
    selectPropDefinition,
    selectInputPropDefinition,
    tablePropDefinition,
    inputPropDefinition,
    inputRangePropDefinition,
    textAreaPropDefinition,
  ]) {
    expect(Object.hasOwn(definition, 'children')).toBe(true)
  }
})

test('完整公共定义复用各拥有者事实，Flow空自有槽不改变读取模式', () => {
  expect(flowPropDefinition).toEqual(kitPropDefinition)
  expect(kitPropDefinition.children).toBe('state-source-view')
  expect(kitPropDefinition.as).toBe('state-untracked')
  expect(kitPropDefinition.ref).toBe('only-through-prop')
  expect(kitPropDefinition.label).toBe('state-source-view')
  expect(Object.hasOwn(kitPropDefinition, 'description')).toBe(false)
  expect(kitPropDefinition.$styleConfig).toBe('state-value-view')
})

test('Button只补业务模式，候选声明和值域共享同一份事实', () => {
  expect(buttonPropDefinition.as).toBe(kitPropDefinition.as)
  expect(buttonPropDefinition.onClick).toBe('state-value-view')
  expect(buttonPropDefinition.appearance).toBe('state-source-view')
  expect(Button.controllers.style).toEqual(buttonTokens)
  expect(Object.hasOwn(Button.controllers.style, 'buttonStyleConfig')).toBe(
    false,
  )
  expect(Button.controllers.style.buttonGap).toBe(buttonStyle.buttonGap)
})

/**
 * 自有模式真正替换公共模式，系统引用仍不能进入可写状态。
 */
function verifyDefinitionContract() {
  type Override = KitPropDefinition<{ children: 'only-through-prop' }>
  type Props = KitProps<{ $styleConfig: {}; controller: Controller }> & {}
  interface Controller extends KitController<{
    props: Props
    propDefinition: Override
  }> {}
  expectTypeOf<Override['children']>().toEqualTypeOf<'only-through-prop'>()
  expectTypeOf<
    Extract<keyof Controller['props'], 'children' | 'ref'>
  >().toEqualTypeOf<never>()
  expectTypeOf<FlowPropDefinition['as']>().toEqualTypeOf<'state-untracked'>()
  expectTypeOf<FlowController['props']['as']>().toEqualTypeOf<
    State<'div' | undefined>
  >()
  expectTypeOf<
    keyof KitControllerProps<FlowController>
  >().toEqualTypeOf<'ref'>()
  // @ts-expect-error 系统 ref 不能覆盖为可写模式。
  type WritableRef = KitPropDefinition<{ ref: 'state-value-view' }>
  // @ts-expect-error 必须提供完整公共字段事实。
  const incomplete: FlowPropDefinition = { ref: 'only-through-prop' }
  const button: ButtonProps = {
    as: 'button',
    domRef: (_element: HTMLButtonElement) => {},
  }
  // @ts-expect-error 按钮标签契约不退化为默认 div。
  const wrongButton: ButtonProps = { as: 'div' }
  const RenderMissingActions: KitComponent<{
    props: ButtonProps
    controller: ButtonController
    $styleTokens: typeof buttonTokens
  }> = kit(
    {
      name: 'MissingActions',
      propDefinition: buttonPropDefinition,
      $styleConfig: buttonStyleConfig,
      $styleTokens: buttonTokens,
    },
    (_props, { exposeController }) => {
      // @ts-expect-error 交付的业务能力必须满足已声明的按钮 Controller。
      exposeController({})
      return null
    },
  )
  const invalid: FlowProps = {
    // @ts-expect-error 公开方向来自显式配置契约。
    $styleConfig: { $direction: 'diagonal' },
  }
  void incomplete
  void button
  void wrongButton
  void RenderMissingActions
  void invalid
}
void verifyDefinitionContract

/**
 * 已声明的公开组件契约为两个未注解的渲染参数提供类型，完整模式必须兑现控制字段。
 */
function verifyContextualRender() {
  const RenderDeclared: KitComponent<{
    props: FlowProps
    controller: FlowController
  }> = kit(
    {
      name: 'Declared',
      propDefinition: flowPropDefinition,
      $styleConfig: flowStyleConfig,
    },
    (props, { name }) => {
      expectTypeOf(props).toEqualTypeOf<Omit<FlowProps, 'ref'>>()
      expectTypeOf(name).toEqualTypeOf<string>()
      // @ts-expect-error 核心不能取得交付系统独占的 ref。
      props.ref
      // @ts-expect-error 未声明的字段不能从上下文输入出现。
      props.missing
      return null
    },
  )
  const wrongMode = {
    ...flowPropDefinition,
    children: 'only-through-prop',
  } as const
  const RenderWrongMode: KitComponent<{
    props: FlowProps
    controller: FlowController
  }> = kit(
    // @ts-expect-error 实际生成的控制器必须保留公开承诺的 children 控制字段。
    {
      name: 'WrongMode',
      propDefinition: wrongMode,
      $styleConfig: flowStyleConfig,
    },
    () => null,
  )
  interface ExtraController {
    props: FlowController['props'] & { missing: State<number> }
  }
  const RenderExtra: KitComponent<{
    props: FlowProps
    controller: ExtraController
  }> = kit(
    // @ts-expect-error 字段协议不能生成声明中虚构的状态。
    {
      name: 'Extra',
      propDefinition: flowPropDefinition,
      $styleConfig: flowStyleConfig,
    },
    () => null,
  )
  interface NarrowController {
    props: Omit<FlowController['props'], 'label'> & {
      label: State<'fixed'>
    }
  }
  const RenderNarrow: KitComponent<{
    props: FlowProps
    controller: NarrowController
  }> = kit(
    // @ts-expect-error 实际来源值域不能冒充公开声明的更窄 State。
    {
      name: 'Narrow',
      propDefinition: flowPropDefinition,
      $styleConfig: flowStyleConfig,
    },
    () => null,
  )
  interface WrongRefController extends FlowController {
    missing(): void
  }
  type WrongRefProps = KitProps<{
    $styleConfig: FlowStyleConfig
    controller: WrongRefController
  }> & {}
  const RenderWrongRef: KitComponent<{
    props: WrongRefProps
    controller: FlowController
  }> = kit(
    // @ts-expect-error 交付的实际 Controller 必须满足公开 ref 接收方声明的全部能力。
    {
      name: 'WrongRef',
      propDefinition: flowPropDefinition,
      $styleConfig: flowStyleConfig,
    },
    () => null,
  )
  type NumericRefProps = Omit<FlowProps, 'ref'> & { ref?: number }
  const RenderNumericRef: KitComponent<{
    props: NumericRefProps
    controller: FlowController
  }> = kit(
    // @ts-expect-error ref 必须是 Controller 接收器，不能声明为数值。
    {
      name: 'NumericRef',
      propDefinition: flowPropDefinition,
      $styleConfig: flowStyleConfig,
    },
    () => null,
  )
  void RenderNumericRef
  void RenderWrongRef
  void RenderDeclared
  void RenderWrongMode
  void RenderExtra
  void RenderNarrow
}
void verifyContextualRender
