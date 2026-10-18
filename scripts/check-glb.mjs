// Safety check for downloaded/generated .glb files, before anything else opens them.
// Usage: node scripts/check-glb.mjs <file.glb> [more.glb ...]
import { checkGlb } from './glb-safety.mjs'

let failed = false
for (const path of process.argv.slice(2)) {
  const { problems, warnings, stats } = checkGlb(path)
  const verdict = problems.length === 0 ? 'SAFE' : 'UNSAFE'
  console.log(`${verdict}  ${path}  ${stats ? JSON.stringify(stats) : ''}`)
  for (const p of problems) console.log(`  ✗ ${p}`)
  for (const w of warnings) console.log(`  ! ${w}`)
  if (problems.length > 0) failed = true
}
if (process.argv.length < 3) {
  console.log('Usage: node scripts/check-glb.mjs <file.glb> [more.glb ...]')
  failed = true
}
process.exit(failed ? 1 : 0)
