/** 可输入搜索的单项选择，候选由调用方提供。 */
import { createState, For, Show, val, type Source } from '@/foundation'
import { kit, type KitController } from '@/components/tools/kit'
import { componentDescriptionPropsDefinition } from '@/components/tools/KitMarker/KitMarker.prop'
import type { ComponentDescriptionProps } from '@/components/tools/KitMarker/KitMarker'
import type { RefReceiver } from '@/hooks/createRef'
import type { PropsDefinition } from '@/components/tools/componentPropsDirector'
import { Piv } from '@/components/Piv/Piv'
import { createPopoverPlugins } from '@/components/plugins/kits/Popover/popover'
import {
  tooltip,
  type TooltipOptions,
} from '@/components/plugins/kits/tooltip/tooltip'
import { useFormFieldId } from '../FormField/FormField'
import './SelectInput.style'

export type SelectInputOption = {
  value: string
  label: string
  detail?: string
}
export type SelectInputTag = {
  label: string
  tooltip: TooltipOptions['content']
}
export type SelectInputProps = ComponentDescriptionProps & {
  ref?: RefReceiver<SelectInputController>
  id?: Source<string | undefined>
  value: Source<string>
  options: Source<SelectInputOption[]>
  tags?: Source<SelectInputTag[] | undefined>
  message?: Source<string | undefined>
  onQuery: (query: string) => void
  onSelect: (option: SelectInputOption) => void
  onClose?: () => void
}
const definition = {
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
} as const satisfies PropsDefinition<SelectInputProps>
export type SelectInputController = KitController<
  SelectInputProps,
  typeof definition
>

/** 点击输入框打开候选；输入时查询，方向键和 Enter 选择，Escape 恢复已选值。 */
export const SelectInput = kit<SelectInputProps, typeof definition>(
  {
    name: 'SelectInput',
    description: '搜索并选择一项',
    availableProps: definition,
  },
  (props: SelectInputProps) => {
    const fieldId = useFormFieldId(),
      listId = crypto.randomUUID()
    const query = createState(''),
      editing = createState(false),
      active = createState(0)
    let input: HTMLInputElement
    const { plugins, controller } = createPopoverPlugins({
      trigger: { triggerAction: false },
      body: {
        $anchorPosition: 'bottom',
        $anchorGap: 'sm',
        autoFocus: false,
        onClose: () => {
          editing.set(false)
          props.onClose?.()
        },
      },
    })
    const open = () => {
      if (!val(controller.isOpen)) {
        active.set(0)
        props.onQuery('')
        controller.showPopover()
      }
    }
    const choose = (option: SelectInputOption) => {
      editing.set(false)
      props.onSelect(option)
      controller.hidePopover()
    }
    return (
      <>
        <Piv
          class="SelectInput"
          is={plugins.trigger}
          on={{
            click: () => {
              input.focus()
              open()
            },
          }}
        >
          <Piv
            as="input"
            class="SelectInput-input"
            id={val(props.id) ?? fieldId ?? undefined}
            domRef={(element) => {
              input = element as HTMLInputElement
            }}
            htmlProps={{
              'value': val(editing) ? val(query) : val(props.value),
              'role': 'combobox',
              'aria-autocomplete': 'list',
              'aria-controls': listId,
              'aria-expanded': val(controller.isOpen) ? 'true' : 'false',
              'aria-activedescendant':
                val(controller.isOpen) && val(props.options).length
                  ? `${listId}-${val(active)}`
                  : undefined,
            }}
            on={{
              input: ({ element }) => {
                const value = (element as HTMLInputElement).value
                query.set(value)
                editing.set(true)
                active.set(0)
                props.onQuery(value)
                if (!val(controller.isOpen)) controller.showPopover()
              },
              keydown: ({ event }) => {
                const key = (event as KeyboardEvent).key,
                  options = val(props.options)
                if (key === 'ArrowDown') {
                  event.preventDefault()
                  if (!val(controller.isOpen)) open()
                  else if (options.length)
                    active.set(Math.min(val(active) + 1, options.length - 1))
                }
                if (key === 'ArrowUp') {
                  event.preventDefault()
                  active.set(Math.max(val(active) - 1, 0))
                }
                if (
                  key === 'Enter' &&
                  val(controller.isOpen) &&
                  options[val(active)]
                ) {
                  event.preventDefault()
                  choose(options[val(active)]!)
                }
                if (key === 'Escape') {
                  editing.set(false)
                  controller.hidePopover()
                }
              },
            }}
          />
          <Show when={!val(editing)}>
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
          is={plugins.body}
          htmlProps={{ id: listId, role: 'listbox' }}
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
                  'id': `${listId}-${index()}`,
                  'role': 'option',
                  'aria-selected': index() === val(active) ? 'true' : 'false',
                  'title': option.detail,
                }}
                on={{ click: () => choose(option) }}
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
