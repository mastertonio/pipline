import { useLayoutEffect, useRef } from 'react'
import markup from './referenceMarkup'
import { initializeCalculator } from './referenceBehavior'

export default function App() {
  const host = useRef(null)
  useLayoutEffect(() => {
    // Keep the supplied source's DOM and event model intact for exact fidelity.
    // Markup is a checked-in constant; no user content is interpreted as HTML here.
    host.current.innerHTML = markup
    const dispose = initializeCalculator()
    return () => { dispose(); host.current.replaceChildren() }
  }, [])
  return <div ref={host} />
}
