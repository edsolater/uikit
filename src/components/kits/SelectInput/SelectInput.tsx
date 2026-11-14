/**
 * SelectInput 是可搜索的单项选择控件。
 *
 * 呈现输入、候选和已选说明，将查询与选择动作交给调用方。
 *
 * 让业务拥有数据来源，组件统一维护候选交互和原生选择语义。
 */
import { createState, For, Show, val, type Source } from '@/foundation'
import { kit, type KitController } from '../../tools/kit'
import { componentDescriptionPropsDefinition } from '../../tools/KitMarker/KitMarker.prop'
import type { ComponentDescriptionProps } from '../../tools/KitMarker/KitMarker'
import type { RefReceiver } from '@/hooks/createRef'
import type { PropsDefinition } from '../../tools/componentPropsDirector'
import { Piv } from '../../Piv/Piv'
import { createPopoverPlugins } from '../../plugins/kits/Popover/popover'
import {
  tooltip,
  type TooltipOptions,
} from '../../plugins/kits/tooltip/tooltip'
import { useFormFieldId } from '../FormField/FormField'
import './SelectInput.style'

/** 候选项以 value 标识选择，label 和 detail 分别呈现主名称与补充内容。 */
export type SelectInputOption = {
  value: string
  label: string
  detail?: string
}
/** 已选值的补充标签及对应说明内容。 */
export type SelectInputTag = {
  label: string
  /** 标签的补充说明，可以是结构化内容。 */
  tooltip: TooltipOptions['content']
}
/** 选值、候选和业务动作协议；组件管理编辑过程，调用方处理查询与选择。 */
export type SelectInputProps = ComponentDescriptionProps & {
  ref?: RefReceiver<SelectInputController>
  id?: Source<string | undefined>
  value: Source<string>
  options: Source<SelectInputOption[]>
  /** 已选值的附加说明，最多显示前三项。 */
  tags?: Source<SelectInputTag[] | undefined>
  message?: Source<string | undefined>
  onQuery: (query: string) => void
  onSelect: (option: SelectInputOption) => void
  onClose?: () => void
}
/** 动态显示字段持续保留来源，业务动作只从上游交付。 */
const selectInputPropsDefinition = {
  ...componentDescriptionPropsDefinition,
  id: 'state-source-view',
  value: 'state-source-view',
  options: 'state-source-view',
  tags: 'state-source-view',
  message: 'state-source-view',
  onQuery: 'only-through-prop',
  onSelect: 'only-through-prop',
  onClose: 'only-through-prop',
  ref: 'only-through-prop',
} satisfies PropsDefinition<SelectInputProps>
/** 搜索选择控件自身输入的运行期控制入口。 */
export type SelectInputController = KitController<
  SelectInputProps,
  typeof selectInputPropsDefinition
>

/**
 * 搜索并选择一项；输入时调用 onQuery，选择时交付选项。
 * 点击输入框展开候选；方向键和 Enter 选择，Escape 恢复 value。
 * 未编辑时显示 value 和最多三个标签；关闭候选时调用 onClose。
 */
export const SelectInput = kit<
  SelectInputProps,
  typeof selectInputPropsDefinition
>(
  {
    name: 'SelectInput',
    description: '搜索并选择一项',
    propsDefinition: selectInputPropsDefinition,
  },
  (props: SelectInputProps) => {
    const fieldId = useFormFieldId(),
      optionsId = crypto.randomUUID()
    const searchText = createState(''),
      isEditing = createState(false),
      activeOptionIndex = createState(0)
    let inputElement: HTMLInputElement
    const { plugins: popoverPlugins, controller: popoverController } =
      createPopoverPlugins({
        trigger: { triggerAction: false },
        body: {
          $anchorPosition: 'bottom',
          $anchorGap: 'sm',
          autoFocus: false,
          onClose: () => {
            isEditing.set(false)
            props.onClose?.()
          },
        },
      })
    /**
     * 展开候选时请求完整列表。
     */
    const openOptions = () => {
      if (!val(popoverController.isOpen)) {
        activeOptionIndex.set(0)
        props.onQuery('')
        popoverController.showPopover()
      }
    }
    /**
     * 提交所选项并关闭候选。
     */
    const selectOption = (option: SelectInputOption) => {
      isEditing.set(false)
      props.onSelect(option)
      popoverController.hidePopover()
    }
    return (
      <>
        <Piv
          class="SelectInput"
          is={popoverPlugins.trigger}
          on={{
            click: () => {
              inputElement.focus()
              openOptions()
            },
          }}
        >
          <Piv
            as="input"
            class="SelectInput-input"
            id={val(props.id) ?? fieldId ?? undefined}
            domRef={(element) => {
              inputElement = element as HTMLInputElement
            }}
            htmlProps={{
              'value': val(isEditing) ? val(searchText) : val(props.value),
              'role': 'combobox',
              'aria-autocomplete': 'list',
              'aria-controls': optionsId,
              'aria-expanded': val(popoverController.isOpen) ? 'true' : 'false',
              'aria-activedescendant':
                val(popoverController.isOpen) && val(props.options).length
                  ? `${optionsId}-${val(activeOptionIndex)}`
                  : undefined,
            }}
            on={{
              input: ({ element }) => {
                const value = (element as HTMLInputElement).value
                searchText.set(value)
                isEditing.set(true)
                activeOptionIndex.set(0)
                props.onQuery(value)
                if (!val(popoverController.isOpen))
                  popoverController.showPopover()
              },
              keydown: ({ event }) => {
                const key = (event as KeyboardEvent).key,
                  options = val(props.options)
                if (key === 'ArrowDown') {
                  event.preventDefault()
                  if (!val(popoverController.isOpen)) openOptions()
                  else if (options.length)
                    activeOptionIndex.set(
                      Math.min(val(activeOptionIndex) + 1, options.length - 1),
                    )
                }
                if (key === 'ArrowUp') {
                  event.preventDefault()
                  activeOptionIndex.set(Math.max(val(activeOptionIndex) - 1, 0))
                }
                if (
                  key === 'Enter' &&
                  val(popoverController.isOpen) &&
                  options[val(activeOptionIndex)]
                ) {
                  event.preventDefault()
                  selectOption(options[val(activeOptionIndex)]!)
                }
                if (key === 'Escape') {
                  isEditing.set(false)
                  popoverController.hidePopover()
                }
              },
            }}
          />
          <Show when={!val(isEditing)}>
            <For each={(val(props.tags) ?? []).slice(0, 3)}>
              {(tag) => (
                <Piv
                  as="span"
                  class="SelectInput-tag"
                  is={tooltip({ content: tag.tooltip })}
                >
                  {tag.label}
                </Piv>
              )}
            </For>
          </Show>
        </Piv>
        <Piv
          class="SelectInput-options"
          is={popoverPlugins.body}
          htmlProps={{ id: optionsId, role: 'listbox' }}
        >
          <Show when={val(props.message)}>
            {(message) => <Piv class="SelectInput-message">{message()}</Piv>}
          </Show>
          <For each={val(props.options)}>
            {(option, index) => (
              <Piv
                as="button"
                class="SelectInput-option"
                htmlProps={{
                  'type': 'button',
                  'id': `${optionsId}-${index()}`,
                  'role': 'option',
                  'aria-selected':
                    index() === val(activeOptionIndex) ? 'true' : 'false',
                  'title': option.detail,
                }}
                on={{ click: () => selectOption(option) }}
              >
                {option.label}
              </Piv>
            )}
          </For>
        </Piv>
      </>
    )
  },
)
