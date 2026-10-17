import { lazy, Suspense } from 'react'
import { Footer } from './ui/Footer.tsx'

// The 3D code (three.js) is large, so it loads after the header and footer have appeared.
const Stage = lazy(() => import('./scene/Stage.tsx'))

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>F1 Engineering Lab</h1>
        <p>Build, tune and test the Red Bull RB19</p>
      </header>
      <main className="app-stage">
        <Suspense fallback={<div className="stage-fallback">Loading 3D view…</div>}>
          <Stage />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
