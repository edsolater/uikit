import { useEffect } from 'react'
import { DrawerProps } from '../Drawer'
import { createPlugin } from '../../../plugins'
import { DivProps } from '../../../Div'
import { createEventCenter } from '@edsolater/fnkit'
import { useToggle } from '../../../hooks'
import { Plugin } from '../../../plugins/type'

/**
 * 
 * create 2 corresponding plugin. one for trigger(Button), one for drawer panel
 * 
 * @example Basic usage
 * const [r, c] = createDrawerTriggerPair()
 * 
 * export function DrawerExample() {
 *   return (
 *     <ExamplePanel name='Drawer'>
 *       <Button plugin={c}>Open</Button>
 *       <Drawer plugin={r}>Hello world</Drawer>
 *     </ExamplePanel>
 *   )
 * }
 * 
 */
export function createDrawerTriggerPair(): [receptor: Plugin<DrawerProps>, child: Plugin<DivProps>] {
  const eventCenter = createEventCenter<{ toggle: () => {} }>()

  const child = createPlugin<DivProps>(() => ({
    onClick() {
      eventCenter.emit('toggle', [])
    }
  }))

  const receptor = createPlugin<DrawerProps>(() => {
    const [isOpen, { toggle, off }] = useToggle()

    useEffect(() => {
      const sub = eventCenter.on('toggle', toggle)
      return sub.unsubscribe
    }, [])

    return {
      open: isOpen,
      onClose: off
    }
  })
  return [receptor, child]
}
