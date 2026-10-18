import { lazy, Suspense, useState } from 'react'
import { TEST_PARTS, candidatesFor } from '../data/partTest.ts'

const PartTestViewer = lazy(() => import('../scene/PartTestViewer.tsx'))

// Step 3 screen: the reference picture next to each AI generator's 3D result.
export function PartTest() {
  const [partId, setPartId] = useState(TEST_PARTS[0].id)
  const part = TEST_PARTS.find((p) => p.id === partId) ?? TEST_PARTS[0]
  const candidates = candidatesFor(part.id)

  return (
    <div className="part-test">
      <nav className="part-test-tabs" aria-label="Test parts">
        {TEST_PARTS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={p.id === part.id ? 'active' : ''}
            aria-pressed={p.id === part.id}
            onClick={() => setPartId(p.id)}
          >
            {p.name}
          </button>
        ))}
      </nav>
      <div className="part-test-body">
        <figure className="part-test-reference">
          {part.reference ? (
            <>
              <img src={part.reference} alt={`Reference picture: ${part.name}`} />
              <figcaption>Reference picture (input for the generators)</figcaption>
            </>
          ) : (
            <figcaption className="part-test-note">No AI reference: this part is modelled by hand in Blender.</figcaption>
          )}
        </figure>
        <div className="part-test-viewer">
          {candidates.length === 0 ? (
            <div className="stage-fallback">No 3D candidates generated for this part yet.</div>
          ) : (
            <>
              <Suspense fallback={<div className="stage-fallback">Loading 3D view…</div>}>
                <PartTestViewer candidates={candidates} />
              </Suspense>
              {/* Names in the same left-to-right order as the models. */}
              <ol className="candidate-labels">
                {candidates.map((c) => (
                  <li key={c.model}>{c.tool}</li>
                ))}
              </ol>
            </>
          )}
        </div>
      </div>
      {candidates.length > 0 && (
        <table className="part-test-table">
          <thead>
            <tr>
              <th>Generator</th>
              <th>Licence</th>
              <th>Triangles</th>
              <th>File size</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c) => (
              <tr key={c.model}>
                <td>{c.tool}</td>
                <td>{c.licence}</td>
                <td>{c.triangles.toLocaleString()}</td>
                <td>{c.sizeMB.toFixed(2)} MB</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
