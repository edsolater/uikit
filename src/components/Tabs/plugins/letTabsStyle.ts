import { addDefault } from '@edsolater/fnkit'
import { TabsProps } from '..'
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

export const letTabsStyle = createPlugin<LetTabsStyleOptions & TabsProps<any>>(
  (props) => ({
    icss: addDefault(props?.variables ?? {}, {
      '--container-bg': '#eaf0ef80',
      '--float-bg': '#afbaba',
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
            background: 'var(--float-bg)',
            borderRadius: 'var(--inner-radius)'
          }
        }
      })
    }
  }),
  { priority: -1 }
)
