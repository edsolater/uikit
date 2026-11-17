/**
 * UIKit 组件、交互与构件工具的公开入口。
 *
 * 汇总所属领域的公开契约，并加载共同的原生控件和文档样式。
 *
 * 让使用方从稳定入口取得能力，内部实现仍直接引用负责文件。
 */
import '@/style-system/pieces/native-controls.style'
import '@/style-system/pieces/document.style'

export * from './Piv/on/event-declarations'
export * from './Piv/plugin/mergePivProps'
export {
  createPropsDeclaration,
  hasPropDeclaration,
  type PropsDeclaration,
  type PropsDeclarationInput,
  type PropsDeclarationOptions,
  type PropAccumulation,
} from './tools/propsDeclaration/shadowProps'
export { collectPluginDeclarations } from './tools/propsDeclaration/plugins'
export * from './Piv/plugin/structure'
export * from './Piv/Piv'
export * from './Piv/type'
export {
  ComponentIdentityMarker,
  type ComponentIdentityMarkerProps,
  type ComponentIdentityMarkerDisplayProps,
} from './tools/ComponentIdentityMarker/ComponentIdentityMarker'
export { ComponentIdentityMarkerStructureViewTrigger } from './tools/ComponentIdentityMarker/ComponentIdentityMarkerStructureViewTrigger'
export { componentIdentityMarkerStructureViewTriggerOffset } from './tools/ComponentIdentityMarker/ComponentIdentityMarkerStructureViewTrigger.style'
export {
  componentIdentityMarkerStructureViewMaskColor,
  componentIdentityMarkerStructureViewMaskBlur,
  componentIdentityMarkerStructureViewLabelColor,
} from './tools/ComponentIdentityMarker/StructureViewOverlay.style'
export { Loop } from './kits/Loop/Loop'
export type { LoopProps, LoopController } from './kits/Loop/Loop.prop'
export { Flow } from './kits/Flow/Flow'
export {
  flowPropDefinition,
  type FlowProps,
  type FlowController,
  type FlowPropDefinition,
} from './kits/Flow/Flow.prop'
export type { FlowStyleConfig } from './kits/Flow/Flow.style'
export { Page } from './kits/Page/Page'
export type { PageProps, PageController } from './kits/Page/Page.prop'
export { TextArea } from './kits/TextArea/TextArea'
export type {
  TextAreaProps,
  TextAreaController,
} from './kits/TextArea/TextArea.prop'
export { Select } from './kits/Select/Select'
export type { SelectProps, SelectController } from './kits/Select/Select.prop'
export { Checkbox } from './kits/Checkbox/Checkbox'
export type {
  CheckboxProps,
  CheckboxController,
} from './kits/Checkbox/Checkbox.prop'
export { Details } from './kits/Details/Details'
export type {
  DetailsProps,
  DetailsController,
} from './kits/Details/Details.prop'
export { MessageBoard } from './kits/MessageBoard/MessageBoard'
export type {
  MessageBoardProps,
  MessageBoardController,
} from './kits/MessageBoard/MessageBoard.prop'
export { Link } from './kits/Link/Link'
export type { LinkProps, LinkController } from './kits/Link/Link.prop'
export * from './kits/Button/Button.mapping'
export * from './kits/Button/Button.style'
export { Button } from './kits/Button/Button'
export {
  buttonPropDefinition,
  type ButtonPropDefinition,
  type ButtonAppearance,
  type ButtonEmphasis,
  type ButtonTone,
  type ButtonSize,
  type ButtonStatus,
  type ButtonProps,
  type ButtonController,
} from './kits/Button/Button.prop'
export { Input } from './kits/Input/Input'
export type { InputProps, InputController } from './kits/Input/Input.prop'
export { InputRange } from './kits/InputRange/InputRange'
export type {
  InputRangeProps,
  InputRangeController,
} from './kits/InputRange/InputRange.prop'
export { Text } from './kits/Text/Text'
export type { TextProps, TextController } from './kits/Text/Text.prop'
export { Numeric } from './kits/Numeric/Numeric'
export type {
  NumericProps,
  NumericController,
} from './kits/Numeric/Numeric.prop'
export { Percent } from './kits/Percent/Percent'
export type {
  PercentProps,
  PercentController,
} from './kits/Percent/Percent.prop'
export { Label } from './kits/Label/Label'
export type { LabelProps, LabelController } from './kits/Label/Label.prop'
export { Help } from './kits/Help/Help'
export type { HelpProps, HelpController } from './kits/Help/Help.prop'
export { Heading } from './kits/Heading/Heading'
export type {
  HeadingProps,
  HeadingController,
} from './kits/Heading/Heading.prop'
export {
  createPopoverPlugins,
  type AnchorPosition,
  type PopoverTriggerOptions,
  type PopoverBodyOptions,
  type AnchorGap,
  type PopoverOptions,
  type PopoverPlugins,
  type PopoverResult,
  type PopoverController,
  type PopoverTriggerController,
  type PopoverBodyController,
} from './plugins/kits/Popover/popover'
export { Card } from './kits/Card/Card'
export type {
  CardVariantProps,
  CardSizeProps,
  CardProps,
  CardController,
} from './kits/Card/Card.prop'
export { Board } from './kits/Board/Board'
export type {
  BoardProps,
  BoardVariantProps,
  BoardSizeProps,
  BoardController,
  BoardControllerRegistry,
} from './kits/Board/Board.prop'
export { boardBorder } from './kits/Board/Board.style'
export { Article } from './kits/Article/Article'
export { Markdown } from './kits/Markdown/Markdown'
export type {
  MarkdownProps,
  MarkdownController,
  MarkdownRenderers,
  MarkdownRendererInputs,
  MarkdownContent,
} from './kits/Markdown/Markdown.prop'
export { markdownBlockSpace } from './kits/Markdown/Markdown.style'
export type {
  ArticleProps,
  ArticleController,
} from './kits/Article/Article.prop'
export { Table } from './kits/Table/Table'
export type { TableProps, TableController } from './kits/Table/Table.prop'
export type { TableStyleConfig } from './kits/Table/Table.style'
export * from './kits/kitContext'
export {
  createVariantPropsParser,
  type VariantProps,
  type VariantPropsGroup,
  type VariantDetails,
  type VariantPropsParseResult,
} from './kits/utils/parseVariantProps'
export * from './kits/utils/parseStatusProps'
export * from './plugins/kits/dragAndDrop/dragAndDrop'
export * from './plugins/tools/createInactivePlugin'
export * from './plugins/tools/createInactivePlugins'
export * from './plugins/kits/clickable/clickable'
export * from './plugins/kits/dragAndDrop/draggable/draggable'
export * from './plugins/kits/dragAndDrop/droppable/droppable'
export * from './plugins/kits/dragAndDrop/droppable/dropContext'
export * from './plugins/kits/hoverable/hoverable'
export * from './plugins/kits/tabular-num/tabular-num'
export * from './plugins/kits/topLayer/topLayer'
export {
  tooltip,
  type TooltipOptions,
  type TooltipController,
} from './plugins/kits/tooltip/tooltip'
export * from './tools/defaultProps'
export * from './tools/toJSX'
export * from './tools/type'

export { Grid } from './kits/Grid/Grid'
export type { GridProps, GridController } from './kits/Grid/Grid.prop'
export type { GridStyleConfig } from './kits/Grid/Grid.style'
export { Field } from './kits/Field/Field'
export type { FieldProps, FieldController } from './kits/Field/Field.prop'
export { useFormFieldId, FormField } from './kits/FormField/FormField'
export type {
  FormFieldProps,
  FormFieldController,
} from './kits/FormField/FormField.prop'
export { SelectInput } from './kits/SelectInput/SelectInput'
export type {
  SelectInputOption,
  SelectInputTag,
  SelectInputProps,
  SelectInputController,
} from './kits/SelectInput/SelectInput.prop'
export { NavigationRegion } from './kits/NavigationRegion/NavigationRegion'
export type {
  NavigationRegionProps,
  NavigationRegionController,
} from './kits/NavigationRegion/NavigationRegion.prop'

export {
  kit,
  kitPropDefinition,
  type KitPropDefinition,
  type KitComponentContext,
  type KitProps,
  type KitPropsConfig,
  type KitControllerProps,
  type KitStyleConfigProps,
  type KitController,
  type KitControllerConfig,
  type KitOptions,
  type KitOptionsConfig,
  type KitComponent,
  type KitComponentConfig,
  type KitInputProps,
} from './tools/kit'
export type {
  ControllerRegistry,
  ControllerRegistryConfig,
} from './tools/controllerRegistry'
export type {
  PropsReadMode,
  PropsDefinition,
  DirectedProps,
  PropsController,
  DefaultPropSources,
  PropsDirectorOptions,
} from './tools/componentPropsDirector'
export { pivPropsDefinition } from './Piv/Piv.prop'
export { componentIdentityMarkerDisplayPropsDefinition } from './tools/ComponentIdentityMarker/ComponentIdentityMarker.prop'
import './plugins/is.style'

export type { StyleConfig, StyleConfigHandler } from './tools/styleConfig'
