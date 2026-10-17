import { useEffect, useRef, useState } from 'react'
import { CAR_INTRO, SECTIONS, partsInSection, type FactId, type Part } from '../data/parts.ts'
import { useCarStore } from '../state/carStore.ts'

// Shows which docs/facts.md rows back up a lesson's numbers.
function FactList({ facts }: { facts: FactId[] }) {
  if (facts.length === 0) return null
  return <p className="part-facts">Sources: {facts.join(', ')}</p>
}

function PartRow({ part }: { part: Part }) {
  const [openByClick, setOpenByClick] = useState(false)
  const selected = useCarStore((s) => s.selectedPartId === part.id)
  const selectPart = useCarStore((s) => s.selectPart)
  const row = useRef<HTMLLIElement>(null)
  const open = openByClick || selected

  // A part clicked in the 3D view scrolls into sight here, with its lesson open.
  useEffect(() => {
    if (selected) row.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [selected])

  return (
    <li className={selected ? 'part selected' : 'part'} ref={row}>
      <button
        className="part-header"
        onClick={() => {
          setOpenByClick(!open)
          if (!open || selected) selectPart(part.id)
        }}
        aria-expanded={open}
        aria-controls={`lesson-${part.id}`}
      >
        <span className="part-step">{part.buildStep}</span>
        <span className="part-name">{part.name}</span>
        <span className={`part-source part-source-${part.source}`}>{part.source === 'ai' ? 'AI planned' : 'Code'}</span>
      </button>
      {open && (
        <div className="part-lesson" id={`lesson-${part.id}`}>
          <p>{part.lesson.text}</p>
          {part.specs && (
            <ul className="part-specs">
              {part.specs.map((spec) => (
                <li key={spec.id}>
                  <strong>{spec.name}:</strong> {spec.description}
                </li>
              ))}
            </ul>
          )}
          <FactList facts={part.lesson.facts} />
        </div>
      )}
    </li>
  )
}

// Lists every part by section in build order. Click a part to read its lesson.
export function PartCatalog() {
  return (
    <aside className="catalog" aria-label="Part catalog">
      <h2>Part catalog</h2>
      <p className="catalog-intro">{CAR_INTRO.text}</p>
      <FactList facts={CAR_INTRO.facts} />
      {SECTIONS.map((section) => (
        <section key={section.id} className="catalog-section">
          <h3>{section.name}</h3>
          <ul>
            {partsInSection(section.id).map((part) => (
              <PartRow key={part.id} part={part} />
            ))}
          </ul>
        </section>
      ))}
    </aside>
  )
}
