import { describe, expect, it } from 'vitest'
import factsMd from '../../docs/facts.md?raw'
import { CAR_INTRO, PARTS, SECTIONS, partsInSection } from './parts.ts'

const factIdsInDoc = new Set([...factsMd.matchAll(/^\| (F-\d{3}) \|/gm)].map((match) => match[1]))

describe('part catalog', () => {
  it('has unique part ids', () => {
    const ids = PARTS.map((part) => part.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('numbers build steps 1, 2, 3… with no gaps', () => {
    expect(PARTS.map((part) => part.buildStep)).toEqual(PARTS.map((_, index) => index + 1))
  })

  it('builds sections in the order listed in SECTIONS', () => {
    const sectionOrder = SECTIONS.map((section) => section.id)
    const visited = PARTS.map((part) => sectionOrder.indexOf(part.section))
    expect(visited).toEqual([...visited].sort((a, b) => a - b))
  })

  it('has at least one part in every section', () => {
    for (const section of SECTIONS) {
      expect(partsInSection(section.id).length, section.id).toBeGreaterThan(0)
    }
  })

  it('gives AI parts a model path and code parts none', () => {
    for (const part of PARTS) {
      if (part.source === 'ai') expect(part.model).toBe(`/models/parts/${part.id}.glb`)
      else expect(part.model).toBeUndefined()
    }
  })

  it('gives every part its own attach object (so moving one part never moves another)', () => {
    const attaches = new Set(PARTS.map((part) => part.attach))
    expect(attaches.size).toBe(PARTS.length)
  })

  it('only points to parent parts that exist', () => {
    const ids = new Set(PARTS.map((part) => part.id))
    for (const part of PARTS) {
      if (part.parent) expect(ids.has(part.parent), part.id).toBe(true)
    }
  })
})

describe('facts in lessons', () => {
  const lessons = [{ id: 'car-intro', ...CAR_INTRO }, ...PARTS.map((part) => ({ id: part.id, ...part.lesson }))]

  it('finds the facts table in docs/facts.md', () => {
    expect(factIdsInDoc.size).toBeGreaterThan(0)
  })

  it.each(lessons)('$id cites only facts that exist in docs/facts.md', ({ facts }) => {
    for (const id of facts) expect(factIdsInDoc.has(id), id).toBe(true)
  })

  // Catches digits and common number words; the f1-fact-checker agent reviews the rest.
  const NUMBER = /\d|\b(one|two|three|four|five|six|seven|eight|nine|ten|twice)\b/i

  it.each(lessons)('$id cites a fact for every number in its text', ({ text, facts }) => {
    if (NUMBER.test(text)) expect(facts.length).toBeGreaterThan(0)
  })
})
