import { useState } from 'react'

export function useDOM<T extends HTMLElement = HTMLElement>(): [
  T | undefined,
  React.Dispatch<React.SetStateAction<T | undefined>>
] {
  const [domObject, setDomObject] = useState<T>()
  return [domObject, setDomObject]
}
