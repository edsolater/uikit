/**
 * kit 是组件的统一创建入口。
 *
 * 根据定义接入身份标记、根样式、结构查看及可选的输入控制与实例集合。
 *
 * 共同接线由通用层承担，让组件函数集中表达自身业务。
 */
import {
  createComponent,
  useContext,
  createRenderEffect,
  onCleanup,
  type JSX,
  type Source,
  type Val,
} from '@/foundation'
import { getOwner, runWithOwner, untrack } from '@/foundation/reactivity'
import type { RefReceiver } from '@/hooks/createRef'
import type { PivProps } from '../Piv/Piv'
import type { PivTag } from '../Piv/domMap'
import type { Token } from '@/style-system'
import {
  createVariantPropSources,
  type VariantPropsGroup,
} from '../kits/utils/parseVariantProps'
import { bindStyleConfig, type StyleConfig } from './styleConfig'
import {
  componentIdentityMarkerDisplayPropsDefinition,
  type ComponentIdentityMarkerDisplayPropDefinition,
} from './ComponentIdentityMarker/ComponentIdentityMarker.prop'
import { ElementDeclarationsContext } from '../Piv/elementDeclarations'
import { ComponentIdentityMarker } from './ComponentIdentityMarker/ComponentIdentityMarker'
import type { ComponentIdentityMarkerDisplayProps } from './ComponentIdentityMarker/ComponentIdentityMarker'
import {
  createComponentPropsDirector,
  type DirectedProps,
  type PropsController,
  type PropsDefinition,
  type PropsReadMode,
  type PropsDirectorOptions,
} from './componentPropsDirector'
import {
  createControllerRegistry,
  type ControllerRegistry,
} from './controllerRegistry'
import { pivPropsDefinition, type PivPropDefinition } from '../Piv/Piv.prop'

// =============================================================================
// 公共输入与字段协议
// =============================================================================

/** 由上游接收当前实例的 Controller；ref 本身不属于可干预的输入。 */
export interface KitControllerProps<Controller> {
  /** 创建时提供才启用受控模式；之后替换接收器仍交付同一个 Controller。 */
  ref?: RefReceiver<Controller>
}

/** 将组件独立声明的样式配置包装为输入；整个配置与各字段均可使用 Source。 */
export type KitStyleConfigProps<Config> = {
  /** 省略的字段沿用组件默认样式；底层 CSS 输入仍由 Piv.style 承担。 */
  styleConfig?: keyof Config extends never
    ? Source<object | undefined>
    : Source<
        { [Key in keyof Config]?: Source<Config[Key] | undefined> } | undefined
      >
}

/** 公共输入的角色选择；所有字段可省略，不从组件实现反推。 */
export interface KitPropsConfig {
  styleConfig?: object
  controller?: { props: object }
  domTag?: PivTag
}

/** 公共输入的集中默认值；未指定控制器时仅承诺通用输入协议。 */
type KitPropsDefaults = {
  styleConfig: {}
  controller: { props: object }
  domTag: 'div'
}

/** 组件公共输入；可按名称独立选择样式契约、控制器和原生标签。 */
export type KitProps<Config extends KitPropsConfig = {}> = PivProps<
  'domTag' extends keyof Config
    ? NonNullable<Config['domTag']> extends never
      ? KitPropsDefaults['domTag']
      : NonNullable<Config['domTag']>
    : KitPropsDefaults['domTag']
> &
  ComponentIdentityMarkerDisplayProps &
  KitStyleConfigProps<
    'styleConfig' extends keyof Config
      ? NonNullable<Config['styleConfig']> extends never
        ? KitPropsDefaults['styleConfig']
        : NonNullable<Config['styleConfig']>
      : KitPropsDefaults['styleConfig']
  > &
  KitControllerProps<
    'controller' extends keyof Config
      ? NonNullable<Config['controller']> extends never
        ? KitPropsDefaults['controller']
        : NonNullable<Config['controller']>
      : KitPropsDefaults['controller']
  >

/** Kit 自己拥有的读取规则；不包含 Piv 或结构查看显示字段。 */
const kitCommonPropDefinition = {
  ref: 'only-through-prop',
  styleConfig: 'state-value-view',
} as const

/** 公共字段协议的基础形状，与下方运行时公共定义对应。 */
type KitBasePropDefinition = PivPropDefinition &
  ComponentIdentityMarkerDisplayPropDefinition &
  typeof kitCommonPropDefinition

/**
 * 将组件自有字段的读取模式并入公共协议，同名字段由自有模式覆盖。
 * 泛型只接收自有模式，空对象表示没有自有字段；ref 始终只能由上游提供。
 */
export type KitPropDefinition<
  OwnDefinition extends Record<keyof OwnDefinition, PropsReadMode> & {
    ref?: 'only-through-prop'
  },
> = Omit<KitBasePropDefinition, keyof OwnDefinition> & OwnDefinition

/** Kit 聚合契约的完整公共字段协议，各拥有者只声明自己的事实。 */
export const kitPropDefinition: KitPropDefinition<{}> = {
  ...pivPropsDefinition,
  ...componentIdentityMarkerDisplayPropsDefinition,
  ...kitCommonPropDefinition,
}

// =============================================================================
// 实例控制与组件契约
// =============================================================================

/**
 * 控制协议的具名输入：props 规定值域，propDefinition 规定字段读取方式。
 * controllerMembers 可补充业务能力，省略时不增加业务成员。
 */
export interface KitControllerConfig<Props extends object = object> {
  props: Props
  propDefinition: PropsDefinition<Props>
  controllerMembers?: object
}

/** 实例由业务能力与可写输入组成；only-through-prop 不进入 props，业务能力不能替换输入控制。 */
export type KitController<
  Config extends KitControllerConfig & {
    propDefinition: PropsDefinition<Config['props']>
  },
> = Omit<
  'controllerMembers' extends keyof Config
    ? NonNullable<Config['controllerMembers']> extends never
      ? object
      : NonNullable<Config['controllerMembers']>
    : object,
  'props'
> & {
  props: PropsController<Config['props'], Config['propDefinition']>
}

/** 核心渲染期间取得的实例上下文；ControllerMembers 只包含已声明的业务能力。 */
export interface KitComponentContext<
  ControllerMembers extends object = object,
> {
  /** 与 ComponentIdentityMarker 共用的组件身份，核心可用它声明根元素的 class。 */
  name: string
  /**
   * 将清理动作绑定到当前实例，卸载时执行。
   * 可解构后在事件中调用，资源仍归创建该上下文的实例所有。
   */
  onCleanup: (cleanup: () => void) => void
  /**
   * 在 render 返回前提供完整业务能力，由 kit 补上 props 后交给 ref。
   * 有业务能力的组件负责调用此方法；没有业务能力时无需交付空对象。
   */
  exposeController(controller: ControllerMembers & object): void
}

/** 组件公开调用的输入、实例控制器与可选样式 Token 集合。 */
export interface KitComponentConfig {
  props: unknown
  controller: unknown
  styleTokens?: unknown
}

/** 组件预先声明的调用与控制契约；kit 据此为 render 提供上下文并校验实现。 */
export type KitComponent<Config extends KitComponentConfig> = {
  (props: Config['props']): JSX.Element
  /** 当前存活的受控实例集合；提供 StyleTokens 时，同一入口还保留样式 Token 集合。 */
  controllers: ControllerRegistry<Config>
}

// =============================================================================
// 组件定义与创建
// =============================================================================

/** 组件创建时固定的定义事实，与每个实例传入的 Props 分开。 */
export interface KitOptionsConfig<Props extends object = object> {
  props: Props
  propDefinition: PropsDefinition<Props>
  styleTokens?: unknown
}

/** 定义输入读取与根样式解释，样式 Token 集合缺省为 undefined。 */
export type KitOptions<
  Config extends KitOptionsConfig & {
    propDefinition: PropsDefinition<Config['props']>
  },
> = {
  /** 覆盖全部 Props 的读取协议，包括公共字段；ref 固定为 only-through-prop。 */
  propDefinition: Config['propDefinition']
  /** 所有实例共用的组件身份，同时交给 Marker 与核心上下文。 */
  name: string
  /**
   * Component 本身使用的职责说明 componentDescription，属于 KitOptions；具体实例的 label 属于 PivProps。
   * 交给 ComponentIdentityMarker 呈现，与实例名称独立，不参与原生无障碍命名。
   */
  componentDescription?: string
  /** 互斥分组及候选字段；启用输入控制时，为未声明的分组建立默认来源。 */
  variantGroups?: readonly Pick<
    VariantPropsGroup<
      Extract<keyof Config['props'], string>,
      Extract<keyof Config['props'], string>
    >,
    'groupName' | 'candidates'
  >[]
  /** 原样登记到 controllers.style 的 Token 集合，不是某个实例的样式配置值。 */
  styleTokens?: 'styleTokens' extends keyof Config
    ? Config['styleTokens']
    : undefined
} & StyleRequirement<Config['props']>

/**
 * 将组件定义和核心渲染函数组合为组件入口，入口同时提供当前受控实例集合。
 *
 * 已声明的 KitComponent 提供 Props 与 Controller 上下文，render 两个参数无需再标注类型。
 * options 固定身份、字段读取与样式解释；render 创建实例内容，并在返回前交付已声明的业务能力。
 * render 的输入契约不包含 ref，引用交付由 kit 负责。
 *
 * 只有创建时提供 ref 的实例才启用输入控制并进入 controllers。
 * 之后替换 ref 会取得同一个 Controller；移除 ref 不退出受控模式，卸载才退出集合。
 * render 在实例创建时执行一次，动态输入由实际消费点读取，不通过重跑 render 更新。
 * 样式配置作为根声明交给内部真实元素；实例名称由 Piv 负责节点语义，kit 与 Marker 不增加容器 DOM。
 *
 * @example
 * type FlowProps = KitProps<{ styleConfig: FlowStyleConfig; controller: FlowController }> & {
 *   // 自有输入
 * }
 * type FlowPropDefinition = KitPropDefinition<{
 *   // 自有字段模式
 * }>
 * const flowPropDefinition: FlowPropDefinition = {
 *   ...kitPropDefinition,
 * }
 * interface FlowController extends KitController<{ props: FlowProps; propDefinition: FlowPropDefinition }> {}
 * const Flow: KitComponent<{ props: FlowProps; controller: FlowController }> = kit(
 *   { name: 'Flow', propDefinition: flowPropDefinition, styleConfig: flowStyleConfig },
 *   (props, { name }) => <Piv shadowProps={props} class={name}>{props.children}</Piv>,
 * )
 */
export function kit<
  Props extends ComponentIdentityMarkerDisplayProps & Pick<PivProps, 'label'>,
  Controller extends { props: object },
  PropDefinition extends PropsDefinition<Props> & { ref: 'only-through-prop' },
  StyleTokens extends Record<string, Token> | undefined = undefined,
>(
  options: KitOptions<{
    props: Omit<Props, 'ref'>
    propDefinition: PropDefinition
    styleTokens: StyleTokens
  }> &
    NoInfer<
      ValidKitOptions<{
        props: Props
        controller: Controller
        propDefinition: PropDefinition
      }>
    >,
  render: (
    props: Omit<Props, 'ref'>,
    context: KitComponentContext<Omit<Controller, 'props'>>,
  ) => JSX.Element,
): KitComponent<{
  props: Props
  controller: Controller
  styleTokens: StyleTokens
}> {
  // 同一定义的实例共用默认来源规则和注册入口；具体字段状态仍由实例各自持有。
  const propDefinition = options.propDefinition
  const variantSources = options.variantGroups
    ? createVariantPropSources(options.variantGroups)
    : undefined
  const [controllers, registry] = createControllerRegistry<
    Controller,
    StyleTokens
  >()
  if (options.styleTokens) registry.addStyleTokens(options.styleTokens)

  /**
   * 接收上游输入，创建带身份说明与根声明的实例内容。
   * 初始 ref 决定是否接入可写输入及实例集合，此决定在实例存活期间保持不变。
   */
  const Component = (sourceProps: Props & KitControllerProps<Controller>) => {
    // 准备同根组合与本实例能力，资源仍绑定当前组件作用域。
    const inheritedDeclarations = useContext(ElementDeclarationsContext)
    const owner = getOwner()
    let exposedMembers: Omit<Controller, 'props'> | undefined
    const context: KitComponentContext<Omit<Controller, 'props'>> = {
      name: options.name,
      /**
       * 将清理动作登记到本实例的创建作用域。
       */
      onCleanup: (cleanup) => runWithOwner(owner, () => onCleanup(cleanup)),
      /**
       * 接收核心提供的业务能力，供本次 render 完成后组合 Controller。
       */
      exposeController: (controller) => {
        exposedMembers = controller
      },
    }
    // sourceProps 保留上游来源，供 ref 换接；renderProps 只在受控模式切换为 Director 视图。
    // 不跟踪初始 ref，避免之后增删接收器重建输入状态或改变受控模式。
    let renderProps: Omit<Props, 'ref'> = sourceProps
    const controlled = untrack(() => sourceProps.ref)
    const propDirector = controlled
      ? createComponentPropsDirector<Props, PropDefinition>(
          sourceProps,
          propDefinition,
          {
            defaultSources: variantSources,
            // 缺省分组通过候选输入计算；候选不再透传给核心，以免与受控分组竞争。
            omit: options.variantGroups?.flatMap((group) =>
              group.groupName in sourceProps ? [] : group.candidates,
            ),
          } as PropsDirectorOptions<Props, PropDefinition>,
        )
      : undefined
    if (propDirector) {
      // 入口已验证 DirectedProps 可赋给 Props；泛型函数体不能保留条件类型证明。
      renderProps = propDirector.props as Omit<Props, 'ref'>
    }
    // Marker 只建立组件身份和说明边界；children 延迟创建，使核心处于此身份的作用域内。
    return createComponent(ComponentIdentityMarker, {
      componentName: options.name,
      get label() {
        return renderProps.label
      },
      get descriptionDisplay() {
        return renderProps.descriptionDisplay
      },
      componentDescription: options.componentDescription,
      get children() {
        return createComponent(renderRoot, {})
      },
    })

    /**
     * 在 Marker 作用域内组合本实例的根声明，再创建共享这些声明的核心内容。
     * 配置保持惰性，由真实根元素消费；声明在根元素处终止向子内容传递。
     */
    function renderRoot() {
      const declarations = [...inheritedDeclarations]
      if (options.styleConfig)
        declarations.push(
          bindStyleConfig(
            options.styleConfig,
            renderProps as {
              styleConfig?: Source<Record<string, unknown> | undefined>
            },
          ),
        )
      return createComponent(ElementDeclarationsContext, {
        value: declarations,
        get children() {
          return createComponent(renderCore, {})
        },
      })
    }

    /**
     * 在根声明作用域内执行一次组件核心，接收业务能力并交付最终 Controller。
     * 只有受控实例进入集合；后续 ref 换接复用同一个对象，卸载时取消登记。
     */
    function renderCore() {
      const content = render(renderProps, context)
      if (propDirector) {
        const controller = Object.defineProperty(
          exposedMembers ?? {},
          'props',
          {
            value: propDirector.controller,
            enumerable: true,
          },
        ) as Controller
        onCleanup(registry.register(controller))
        // 只跟踪接收器的替换，不重跑核心或重建 Controller。
        createRenderEffect(
          () => sourceProps.ref as RefReceiver<Controller> | undefined,
          (receive) => receive?.(controller),
        )
      }
      return content
    }
  }
  return Object.assign(Component, { controllers })
}

// =============================================================================
// 定义的静态校验细节
// =============================================================================

/** 从已声明的 styleConfig 输入还原配置值域，解开整体及字段 Source，不从处理函数反推。 */
type StyleContract<Props> = Props extends { styleConfig?: infer Config }
  ? [NonNullable<Val<Config>>] extends [never]
    ? {}
    : {
        [Key in keyof NonNullable<Val<Config>>]: Val<
          NonNullable<Val<Config>>[Key]
        >
      }
  : never

/** 根元素只解释本作用域使用的配置子集；配置形状仍来自公开输入，处理函数不反向定义它。 */
type StyleRequirement<Props> = 'styleConfig' extends keyof Props
  ? {
      styleConfig?: NoInfer<Partial<StyleConfig<StyleContract<Props>>> & object>
    }
  : { styleConfig?: never }

/** 四项约束共同验证定义与公开契约一致；只接受已有声明，不参与推断或运行。 */
type ValidKitOptions<
  Config extends {
    props: object
    controller: unknown
    propDefinition: PropsDefinition<Config['props']>
  },
> =
  // 字段表不能带入 Props 以外的字段。
  (Exclude<keyof Config['propDefinition'], keyof Config['props']> extends never
    ? unknown
    : never) &
    // 各读取模式产生的输入仍须满足核心的 Props 契约。
    (DirectedProps<
      Omit<Config['props'], 'ref'>,
      Config['propDefinition']
    > extends Omit<Config['props'], 'ref'>
      ? unknown
      : never) &
    // 实际生成的控制字段与业务能力必须满足公开 Controller。
    (KitController<{
      props: Config['props']
      propDefinition: Config['propDefinition']
      controllerMembers: Omit<Config['controller'], 'props'>
    }> extends Config['controller']
      ? unknown
      : never) &
    // 比较 ref 接收的负载，避免函数参数的双变规则放过不匹配的 Controller。
    ('ref' extends keyof Config['props']
      ? NonNullable<Config['props']['ref']> extends RefReceiver<
          infer ExpectedController
        >
        ? Config['controller'] extends ExpectedController
          ? unknown
          : never
        : never
      : never)
