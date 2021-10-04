import { RefObject, useEffect, useState } from 'react'

export default function useOverflowDetecter(domRef: RefObject<HTMLElement | undefined>) {
  const [xOverflowed, setXOverflowed] = useState(false)
  const [yOverflowed, setYOverflowed] = useState(false)
  useEffect(() => {
    if (!domRef.current) return
    if (domRef.current.scrollWidth > domRef.current.clientWidth) setXOverflowed(true)
    if (domRef.current.scrollHeight > domRef.current.clientHeight) setYOverflowed(true)
  }, [])
  return { xOverflowed, yOverflowed }
}
