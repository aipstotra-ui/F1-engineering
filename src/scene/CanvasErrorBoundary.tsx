import { Component, type ReactNode } from 'react'

// If the browser can't start 3D graphics (WebGL), show a message instead of a blank page.
export class CanvasErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="stage-fallback" role="alert">
          3D view unavailable: this browser couldn't start WebGL. Try a recent Chrome, Edge, Firefox or Safari
          with hardware acceleration turned on.
        </div>
      )
    }
    return this.props.children
  }
}
