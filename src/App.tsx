import { Stage } from './scene/Stage.tsx'
import { Footer } from './ui/Footer.tsx'

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>F1 Engineering Lab</h1>
        <p>Build, tune and test the Red Bull RB19</p>
      </header>
      <main className="app-stage">
        <Stage />
      </main>
      <Footer />
    </div>
  )
}
