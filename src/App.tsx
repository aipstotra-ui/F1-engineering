import { lazy, Suspense, useEffect, useState } from 'react'
import { PartCatalog } from './screens/PartCatalog.tsx'
import { PartTest } from './screens/PartTest.tsx'
import { Footer } from './ui/Footer.tsx'

// The 3D code (three.js) is large, so it loads after the header and footer have appeared.
const Stage = lazy(() => import('./scene/Stage.tsx'))

const SCREENS = [
  { hash: '#garage', name: 'Garage' },
  { hash: '#part-test', name: 'AI part test' },
] as const

// Which screen to show comes from the address bar (#garage or #part-test), so links and the back button work.
function useScreenHash() {
  const [hash, setHash] = useState(window.location.hash || '#garage')
  useEffect(() => {
    const onChange = () => setHash(window.location.hash || '#garage')
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return hash
}

export default function App() {
  const hash = useScreenHash()

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>F1 Engineering Lab</h1>
          <p>Build, tune and test the Red Bull RB19</p>
        </div>
        <nav className="app-nav">
          {SCREENS.map((screen) => (
            <a key={screen.hash} href={screen.hash} aria-current={hash === screen.hash ? 'page' : undefined}>
              {screen.name}
            </a>
          ))}
        </nav>
      </header>
      {hash === '#part-test' ? (
        <main className="app-main-single">
          <PartTest />
        </main>
      ) : (
        <main className="app-main">
          <div className="app-stage">
            <Suspense fallback={<div className="stage-fallback">Loading 3D view…</div>}>
              <Stage />
            </Suspense>
          </div>
          <PartCatalog />
        </main>
      )}
      <Footer />
    </div>
  )
}
