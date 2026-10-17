import { useState } from 'react'
import { CAR_INTRO, SECTIONS, partsInSection, type Part } from '../data/parts.ts'

function PartRow({ part }: { part: Part }) {
  const [open, setOpen] = useState(false)

  return (
    <li className="part">
      <button className="part-header" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="part-step">{part.buildStep}</span>
        <span className="part-name">{part.name}</span>
        <span className={`part-source part-source-${part.source}`}>{part.source === 'ai' ? 'AI model' : 'Code'}</span>
      </button>
      {open && (
        <div className="part-lesson">
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
          {part.lesson.facts.length > 0 && <p className="part-facts">Sources: {part.lesson.facts.join(', ')}</p>}
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
