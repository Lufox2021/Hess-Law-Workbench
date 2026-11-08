// Solves and self-checks every built-in problem. Run: node test/solve_all.js
const H = require('../src/engine.js'), P = require('../src/problems.js');
let bad = 0; const ids = new Set();
for (const p of P) {
  const errs = H.validate(p); if (ids.has(p.id)) errs.push('duplicate id'); ids.add(p.id);
  let s; try { s = H.solve(p); } catch (e) { errs.push(e.message); }
  if (s) {
    const ch = s.x.map(x => ({ rev: x.n < 0, mult: H.fracText(H.F(Math.abs(x.n), x.d)).replace('½', '1/2') }));
    const c = H.combine(s, ch); if (c.err || H.compare(s, c.net).length) errs.push('key combination fails');
    s.steps.forEach((st, i) => { if (s.used[i] && !H.checkStepDH(s, i, String(s.dHs[i])).ok) errs.push('dH' + (i + 1) + ' fails'); });
    if (!H.checkTotal(s, String(s.answer)).ok) errs.push('total fails');
    s.variants.forEach(v => { if (H.checkTotal(s, String(v.total)).ok && !H.within(v.total, s.answer, { abs: 0.6, rel: 0.002 })) errs.push('variant accepted'); });
    // identity choice should not pass unless correct
  }
  console.log((errs.length ? '✗ ' : '✓ ') + p.id + '  ' + (s ? 'x = [' + s.x.map(x => H.fracText(x)).join(', ') + ']  ΔH = ' + H.fmt(s.answer) + ' kJ' : '') + (errs.length ? '   ' + errs.join('; ') : ''));
  if (errs.length) bad++;
}
console.log(`\n${P.length} problems, ${bad} with errors`); process.exit(bad ? 1 : 0);
