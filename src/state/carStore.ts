import { create } from 'zustand'

export type ViewMode = 'realistic' | 'hologram'

// Shared view state: how the car is drawn and which part is picked.
// The 3D view and the part catalog both read and change it.
interface CarViewState {
  viewMode: ViewMode
  xray: boolean
  hoveredPartId: string | null
  selectedPartId: string | null
  setViewMode: (mode: ViewMode) => void
  toggleXray: () => void
  hoverPart: (id: string | null) => void
  /** Selecting the part that's already selected clears the selection. */
  selectPart: (id: string | null) => void
}

export const useCarStore = create<CarViewState>((set) => ({
  viewMode: 'realistic',
  xray: false,
  hoveredPartId: null,
  selectedPartId: null,
  setViewMode: (viewMode) => set({ viewMode }),
  toggleXray: () => set((state) => ({ xray: !state.xray })),
  hoverPart: (hoveredPartId) => set({ hoveredPartId }),
  selectPart: (id) => set((state) => ({ selectedPartId: state.selectedPartId === id ? null : id })),
}))
