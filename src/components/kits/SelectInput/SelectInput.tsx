/**
 * SelectInput 是可搜索的单项选择控件。
 *
 * 呈现输入、候选和已选说明，将查询与选择动作交给调用方。
 *
 * 让业务拥有数据来源，组件统一维护候选交互和原生选择语义。
 */
import { createState, stateView, For, Show, val } from '@/foundation'
import { kit, type KitComponent } from '../../tools/kit'
import {
  componentName,
  selectInputPropDefinition,
  type SelectInputProps,
  type SelectInputController,
  type SelectInputOption,
} from './SelectInput.prop'
import { Piv } from '../../Piv/Piv'
import { createPopoverPlugins } from '../../plugins/kits/Popover/popover'
import { tooltip } from '../../plugins/kits/tooltip/tooltip'
import { createFormFieldBinding, useFormFieldId } from '../FormField/FormField'
import './SelectInput.style'

/**
 * 搜索并选择一项；输入时调用 onQuery，选择时交付选项。
 * 点击输入框展开候选；方向键和 Enter 选择，Escape 恢复 value。
 * 未编辑时显示 value 和最多三个标签；关闭候选时调用 onClose。
 */
export const SelectInput: KitComponent<{
  props: SelectInputProps
  controller: SelectInputController
}> = kit(
  {
    name: componentName,
    componentDescription: '搜索并选择一项',
    propDefinition: selectInputPropDefinition,
  },
  (props, { name }) => {
    const { id, rootProps } = createFormFieldBinding(props, useFormFieldId())
    const optionsId = crypto.randomUUID()
    const searchText = createState(''),
      isEditing = createState(false),
      activeOptionIndex = createState(0)
    // 查询结果变化后，所有交互与无障碍声明共用当前仍存在的活动项。
    const currentOptionIndex = stateView(() => {
      const lastIndex = val(props.options).length - 1
      return lastIndex < 0
        ? undefined
        : Math.min(val(activeOptionIndex), lastIndex)
    })
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
          class={name}
          shadowProps={rootProps}
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
            id={id}
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
                val(popoverController.isOpen) &&
                val(currentOptionIndex) !== undefined
                  ? `${optionsId}-${val(currentOptionIndex)}`
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
                  options = val(props.options),
                  currentIndex = val(currentOptionIndex)
                if (key === 'ArrowDown') {
                  event.preventDefault()
                  if (!val(popoverController.isOpen)) openOptions()
                  else if (currentIndex !== undefined)
                    activeOptionIndex.set(
                      Math.min(currentIndex + 1, options.length - 1),
                    )
                }
                if (key === 'ArrowUp') {
                  event.preventDefault()
                  if (currentIndex !== undefined)
                    activeOptionIndex.set(Math.max(currentIndex - 1, 0))
                }
                if (
                  key === 'Enter' &&
                  val(popoverController.isOpen) &&
                  currentIndex !== undefined
                ) {
                  event.preventDefault()
                  selectOption(options[currentIndex]!)
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
          id={optionsId}
          htmlProps={{ role: 'listbox' }}
        >
          <Show when={val(props.message)}>
            {(message) => <Piv class="SelectInput-message">{message()}</Piv>}
          </Show>
          <For each={val(props.options)}>
            {(option, index) => (
              <Piv
                as="button"
                class="SelectInput-option"
                id={`${optionsId}-${index()}`}
                htmlProps={{
                  'type': 'button',
                  'role': 'option',
                  'aria-selected':
                    index() === val(currentOptionIndex) ? 'true' : 'false',
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
