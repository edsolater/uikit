import { useEffect, useMemo } from 'react'
import { MayRef, shrinkMayRef } from '../functions/react/isRefObject'
import { Nullish } from '../typings/constants'
import { addEventListener } from '../functions/dom/addEventListener'
import { mapKey, shakeFalsy, toLowerCase } from '@edsolater/fnkit'
import addTabIndex from '../domHelpers/addTabIndex'

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
 */
type ContentKeyName = KeyNamesActionKey | KeyNamesNavigation | KeyNamesNormalContent
type AuxiliaryKeyName = 'ctrl' | 'shift' | 'alt' | 'ctrl + alt' | 'ctrl + shift' | 'alt + shift' | 'ctrl + alt + shift'
type KeyNamesActionKey = `F${number}` | 'Backspace' | 'Enter' | 'Escape' | 'Delete' | 'Insert'
type KeyNamesNormalContent =
  | '`'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '0'
  | '-'
  | '='
  | 'q'
  | 'w'
  | 'e'
  | 'r'
  | 't'
  | 'y'
  | 'u'
  | 'i'
  | 'o'
  | 'p'
  | '['
  | ']'
  | '\\'
  | 'a'
  | 's'
  | 'd'
  | 'f'
  | 'g'
  | 'h'
  | 'j'
  | 'k'
  | 'l'
  | ';'
  | "'"
  | 'z'
  | 'x'
  | 'c'
  | 'v'
  | 'b'
  | 'n'
  | 'm'
  | ','
  | '.'
  | '/'

type KeyNamesNavigation =
  | 'Tab'
  | 'Home'
  | 'PageUp'
  | 'PageDown'
  | 'End'
  | 'ArrowUp'
  | 'ArrowLeft'
  | 'ArrowRight'
  | 'ArrowDown'

function uniqueItems<T>(arr: T[]): T[] {
  return [...new Set(arr)]
}

/**
 * case insensitive(if u want to bind uppercase 'A' , attach 'shift + a' )
 *
 * it is not so good to customize the `Tab`, `Tab` should be move focus
 */
export function useKeyboardShortcurt(
  el: MayRef<HTMLElement | Nullish>,
  keyboardShortcutSetting: {
    [key in `${`${AuxiliaryKeyName | Capitalize<AuxiliaryKeyName>} + ` | ''}${ContentKeyName}`]?: () => void
  },
  options?: {
    /** this still not prevent **all** brower shortcut (like build-in ctrl T ) */
    preventAllBrowserKeyboardShortcut?: boolean
  }
) {
  // prevent browser default keyboard shortcut (should avoid browser build-in shortcut as much as possiable)
  useEffect(() => {
    if (!options?.preventAllBrowserKeyboardShortcut) return
    const pureEl = shrinkMayRef(el)
    if (!pureEl) return
    preventDefaultKeyboardShortcut(pureEl)
  }, [])

  useEffect(() => {
    const pureEl = shrinkMayRef(el)
    if (!pureEl) return
    bindKeyboardShortcut(pureEl, keyboardShortcutSetting)
  }, [el])
}

type KeyboardShortcutSetting = {
  [key in `${`${AuxiliaryKeyName | Capitalize<AuxiliaryKeyName>} + ` | ''}${ContentKeyName}`]?: () => void
}

function bindKeyboardShortcut(el: HTMLElement, keyboardShortcutSetting: KeyboardShortcutSetting) {
  const formatedKeyboardShortcutSetting = mapKey(keyboardShortcutSetting, (key) =>
    formatKeyboardSettingString(String(key))
  )
  addTabIndex(el) // keydown must have fousable element
  addEventListener(
    el,
    'keydown',
    ({ ev }) => {
      const pressedKey = parseKeyboardEventToGetKeyString(ev)
      formatedKeyboardShortcutSetting[pressedKey]?.()
    },
    { capture: true }
  )
}

/** this still not prevent **all** brower shortcut (like build-in ctrl T ) */
function preventDefaultKeyboardShortcut(pureEl: HTMLElement) {
  pureEl.addEventListener(
    'keydown',
    (ev) => {
      ev.stopPropagation()
      ev.preventDefault()
    },
    { capture: true }
  )
}

function parseKeyboardEventToGetKeyString(ev: KeyboardEvent) {
  const keyArray = [ev.ctrlKey && 'ctrl', ev.shiftKey && 'shift', ev.altKey && 'alt', ev.metaKey && 'meta', ev.key]
  return uniqueItems(shakeFalsy(keyArray).map(toLowerCase)).sort().join(' + ')
}

function formatKeyboardSettingString(keyString: string) {
  const keyArray = keyString.split(/\s?\+\s?/)
  return uniqueItems(shakeFalsy(keyArray).map(toLowerCase)).sort().join(' + ')
}
