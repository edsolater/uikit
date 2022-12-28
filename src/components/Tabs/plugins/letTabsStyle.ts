import { addDefault } from '@edsolater/fnkit'
import { TabsCoreProps } from '..'
import { DivProps } from '../../../Div'
import { mergeProps } from '../../../Div/utils/mergeProps'
import { createPlugin } from '../../../plugins'

export type TabsVariables = {
  '--container-bg'?: string
  '--float-bg'?: string
  '--float-bg-2'?: string
  '--outer-radius'?: string
  '--inner-radius'?: string
}

export type LetTabsStyleOptions = {
  variables?: TabsVariables
}

export const letTabsStyle = createPlugin<LetTabsStyleOptions & TabsCoreProps<any>>(
  (props) => ({
    icss: addDefault(props?.variables ?? {}, {
      '--container-bg': '#eaf0ef80',
      '--float-bg': '#74796e',
      '--float-bg-2': '#c7d8d3',
      '--outer-radius': '8px',
      '--inner-radius': '4px'
    }),
    anatomy: {
      container: {
        icss: {
          padding: '4px 8px',
          borderRadius: 'var(--outer-radius)',
          background: 'var(--container-bg)'
        }
      },
      labelBox: {
        icss: {
          padding: '4px 8px',
          borderRadius: 'var(--inner-radius)'
        }
      },
      letAddFloatBgOptions: ({ activeTabIndex }) => ({
        floatBgProps: {
          icss: {
            background: (activeTabIndex ?? 1) % 2 ? 'var(--float-bg)' : 'var(--float-bg-2)',
            borderRadius: 'var(--inner-radius)'
          }
        }
      })
    }
  }),
  { priority: -1 }
)
