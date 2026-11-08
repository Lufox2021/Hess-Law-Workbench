/* Hess's Law Builder — engine (no DOM; runs in Node for tests) */
var HLE = (function () {
  'use strict';

  // ---------- fractions ----------
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a || 1; }
  function F(n, d) { d = d === undefined ? 1 : d; if (d < 0) { n = -n; d = -d; } var g = gcd(n, d); return { n: n / g, d: d / g }; }
  function add(a, b) { return F(a.n * b.d + b.n * a.d, a.d * b.d); }
  function sub_(a, b) { return F(a.n * b.d - b.n * a.d, a.d * b.d); }
  function mul(a, b) { return F(a.n * b.n, a.d * b.d); }
  function div(a, b) { return F(a.n * b.d, a.d * b.n); }
  function isZero(a) { return a.n === 0; }
  function num(a) { return a.n / a.d; }
  function fromNumber(x) { // 1.5 -> 3/2 (denominators up to 12)
    for (var d = 1; d <= 12; d++) { var n = Math.round(x * d); if (Math.abs(n / d - x) < 1e-9) return F(n, d); }
    return null;
  }
  var UNI = { '½': [1, 2], '⅓': [1, 3], '¼': [1, 4], '¾': [3, 4], '⅔': [2, 3] };
  function parseFrac(s) {
    s = String(s || '').trim().replace(/\s+/g, '').replace(/[−]/g, '-');
    if (s === '') return null;
    var m = /^(-?)(\d*)([½⅓¼¾⅔])$/.exec(s);
    if (m) { var u = UNI[m[3]], w = m[2] ? +m[2] : 0; return F((m[1] ? -1 : 1) * (w * u[1] + u[0]), u[1]); }
    m = /^(-?\d+)\/(\d+)$/.exec(s); if (m) return +m[2] ? F(+m[1], +m[2]) : null;
    if (/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return fromNumber(parseFloat(s));
    return null;
  }
  function fracText(a, forCoef) {
    if (a.d === 1) return String(a.n).replace('-', '−');
    var sign = a.n < 0 ? '−' : '', n = Math.abs(a.n);
    if (a.d === 2 && n === 1) return sign + '½';
    return sign + n + '/' + a.d;
  }

  // ---------- formulas and equations ----------
  function atoms(formula) {
    var s = formula.replace(/\s+/g, ''), i = 0;
    function group() {
      var c = {};
      while (i < s.length && s[i] !== ')') {
        var part;
        if (s[i] === '(') { i++; part = group(); if (s[i] !== ')') throw new Error('missing ) in ' + formula); i++; }
        else { var m = /^[A-Z][a-z]?/.exec(s.slice(i)); if (!m) throw new Error('can’t read formula ' + formula); i += m[0].length; part = {}; part[m[0]] = 1; }
        var n = /^\d+/.exec(s.slice(i)), k = 1; if (n) { k = +n[0]; i += n[0].length; }
        for (var e in part) c[e] = (c[e] || 0) + part[e] * k;
      }
      return c;
    }
    var r = group(); if (i !== s.length) throw new Error('can’t read formula ' + formula); return r;
  }
  function parseSpecies(t) {
    var m = /^(.*?)\s*\(\s*(s|l|g|aq)\s*(?:,\s*([a-z ]+?))?\s*\)$/i.exec(t.trim());
    if (!m) throw new Error('“' + t + '” needs a state, like (g), (l), (s), (aq) or (s, graphite)');
    var formula = m[1].trim(), state = m[2].toLowerCase() + (m[3] ? ', ' + m[3].trim().toLowerCase() : '');
    if (!/^[A-Z(]/.test(formula)) throw new Error('can’t read “' + t + '”');
    atoms(formula);
    return { formula: formula, state: state, key: formula + '(' + state + ')' };
  }
  function parseSide(side) {
    var terms = side.split(/\s\+\s|^\+\s|\s\+$/).map(function (x) { return x.trim(); }).filter(Boolean), out = [];
    terms.forEach(function (t) {
      var m = /^((?:\d+\s*\/\s*\d+)|(?:\d*[½⅓¼¾⅔])|(?:\d+(?:\.\d+)?)|(?:\.\d+))?\s*(.*)$/.exec(t);
      var c = m[1] ? parseFrac(m[1].replace(/\s+/g, '')) : F(1);
      if (!c || c.n <= 0) throw new Error('bad coefficient in “' + t + '”');
      out.push({ c: c, sp: parseSpecies(m[2]) });
    });
    return out;
  }
  function parseEq(str) {
    var s = String(str).replace(/→|⟶|=>/g, '->');
    var parts = s.split('->');
    if (parts.length !== 2) throw new Error('use one arrow (->) in “' + str + '”');
    var L = parseSide(parts[0]), R = parseSide(parts[1]);
    if (!L.length || !R.length) throw new Error('each side needs at least one species: “' + str + '”');
    // net: products positive, reactants negative
    var net = {}, info = {};
    L.forEach(function (t) { net[t.sp.key] = sub_(net[t.sp.key] || F(0), t.c); info[t.sp.key] = t.sp; });
    R.forEach(function (t) { net[t.sp.key] = add(net[t.sp.key] || F(0), t.c); info[t.sp.key] = t.sp; });
    // atom balance
    var bal = {};
    Object.keys(net).forEach(function (k) { var a = atoms(info[k].formula); for (var e in a) bal[e] = add(bal[e] || F(0), mul(net[k], F(a[e]))); });
    var unbalanced = Object.keys(bal).filter(function (e) { return !isZero(bal[e]); });
    return { L: L, R: R, net: net, info: info, unbalanced: unbalanced, src: str };
  }
  function spHTML(sp) { return sp.formula.replace(/(\d+)/g, '<sub>$1</sub>') + '(' + sp.state + ')'; }
  function termHTML(c, sp) { return (c.n === 1 && c.d === 1 ? '' : fracText(c) + ' ') + spHTML(sp); }
  function sideHTML(terms) { return terms.map(function (t) { return termHTML(t.c, t.sp); }).join(' + '); }
  function eqHTML(eq) { return sideHTML(eq.L) + ' → ' + sideHTML(eq.R); }
  // equation from a net map (products > 0)
  function netToSides(net, info) {
    var L = [], R = [];
    Object.keys(net).forEach(function (k) { var c = net[k]; if (isZero(c)) return; (c.n > 0 ? R : L).push({ c: c.n > 0 ? c : F(-c.n, c.d), sp: info[k] }); });
    return { L: L, R: R };
  }
  // a step multiplied by x (x < 0 means reversed)
  function scaledSides(eq, x) {
    var rev = x.n < 0, f = rev ? F(-x.n, x.d) : x;
    var L = (rev ? eq.R : eq.L).map(function (t) { return { c: mul(t.c, f), sp: t.sp }; });
    var R = (rev ? eq.L : eq.R).map(function (t) { return { c: mul(t.c, f), sp: t.sp }; });
    return { L: L, R: R };
  }

  // ---------- linear solve (exact) ----------
  function solveSystem(A, t) { // A: rows species × cols steps, t: target column. Returns x or null (or 'many')
    var rows = A.length, cols = A[0].length, M = A.map(function (r, i) { return r.slice().concat([t[i]]); }), piv = [], r = 0;
    for (var c = 0; c < cols && r < rows; c++) {
      var p = -1; for (var i = r; i < rows; i++) if (!isZero(M[i][c])) { p = i; break; }
      if (p < 0) continue;
      var tmp = M[r]; M[r] = M[p]; M[p] = tmp;
      var pv = M[r][c]; for (var j = c; j <= cols; j++) M[r][j] = div(M[r][j], pv);
      for (i = 0; i < rows; i++) if (i !== r && !isZero(M[i][c])) { var f = M[i][c]; for (j = c; j <= cols; j++) M[i][j] = sub_(M[i][j], mul(f, M[r][j])); }
      piv.push(c); r++;
    }
    for (i = r; i < rows; i++) if (!isZero(M[i][cols])) return null; // inconsistent
    if (piv.length < cols) return 'many';
    var x = []; piv.forEach(function (c, k) { x[c] = M[k][cols]; }); return x;
  }

  function parseNum(s) {
    var v = String(s || '').trim().replace(/[−–]/g, '-').replace(/,/g, '').replace(/\s+/g, '').replace(/^\+/, '');
    return /^-?(\d+\.?\d*|\.\d+)$/.test(v) ? parseFloat(v) : NaN;
  }
  function fmt(x) { var r = Math.round(x * 100) / 100; if (Math.abs(r) < 1e-9) r = 0; return String(r).replace('-', '−'); }
  function sgn(x) { return (x > 0 ? '+' : '') + fmt(x); }
  function within(v, t, tol) { return isFinite(v) && Math.abs(v - t) <= Math.max(tol.abs || 0, Math.abs(t) * (tol.rel || 0)) + 1e-9; }
  var TOL = { abs: 0.6, rel: 0.002 };

  var LEVELS = { 1: 'One or two steps: flip or scale', 2: 'Two steps', 3: 'Three steps', 4: 'Four steps', 5: 'From formation reactions (ΔH°f)' };

  // ---------- solve a problem ----------
  function solve(p) {
    var target = parseEq(p.target), steps = [];
    for (var i = 1; i <= 6; i++) if (p['step' + i] && String(p['step' + i]).trim()) {
      var e = parseEq(p['step' + i]); e.dH = parseNum(p['dH' + i]); e.dHtext = String(p['dH' + i]).trim(); steps.push(e);
    }
    if (!steps.length) throw new Error('no steps given');
    var keys = {}, info = {};
    [target].concat(steps).forEach(function (e) { for (var k in e.net) { keys[k] = 1; info[k] = e.info[k]; } });
    keys = Object.keys(keys);
    var A = keys.map(function (k) { return steps.map(function (s) { return s.net[k] || F(0); }); });
    var t = keys.map(function (k) { return target.net[k] || F(0); });
    var x = solveSystem(A, t);
    if (x === null) throw new Error('the steps can’t be combined to give the target');
    if (x === 'many') throw new Error('more than one way to combine the steps (some steps are redundant)');
    var dHs = steps.map(function (s, i) { return num(x[i]) * s.dH; });
    var ans = dHs.reduce(function (a, b) { return a + b; }, 0);
    var used = steps.map(function (s, i) { return !isZero(x[i]); });

    // anchors: a species in the target that appears in only one step
    var hints = steps.map(function (s, i) {
      if (!used[i]) return 'This step isn’t needed.';
      var cands = Object.keys(s.net).filter(function (k) { return steps.filter(function (o) { return o.net[k]; }).length === 1; });
      var inT = cands.filter(function (k) { return target.net[k]; });
      var k = inT[0] || cands[0];
      if (!k) return 'Every species in this step also appears in another step. Fix the other steps first, then choose this one so the leftovers cancel.';
      var want = target.net[k] || F(0), have = s.net[k];
      var side = function (c) { return c.n > 0 ? 'a product' : 'a reactant'; };
      if (isZero(want)) return spHTML(info[k]) + ' appears only in this step and isn’t in the target, so it must cancel out… which means this step pairs with another. Work on the others first.';
      return spHTML(info[k]) + ' appears only in this step. The target has it as ' + side(want) + ' (' + fracText(F(Math.abs(want.n), want.d)) + '); this step has it as ' + side(have) + ' (' + fracText(F(Math.abs(have.n), have.d)) + '). So ' +
        (have.n * want.n < 0 ? 'reverse it' : 'keep its direction') + ' and multiply by ' + fracText(F(Math.abs(x[i].n), x[i].d)) + '.';
    });

    // variants for diagnosing totals
    var variants = [];
    steps.forEach(function (s, i) {
      if (!used[i]) return;
      var xi = num(x[i]);
      if (xi < 0) variants.push({ i: i, total: ans - 2 * dHs[i], msg: 'Step ' + (i + 1) + ' was reversed, so its ΔH changes sign. It looks like you kept the original sign.' });
      else variants.push({ i: i, total: ans - 2 * dHs[i], msg: 'Check the sign of step ' + (i + 1) + '’s ΔH. It isn’t reversed, so it keeps its sign.' });
      if (Math.abs(xi) !== 1) variants.push({ i: i, total: ans - dHs[i] + Math.sign(xi) * s.dH, msg: 'Step ' + (i + 1) + ' was multiplied by ' + fracText(F(Math.abs(x[i].n), x[i].d)) + ', so its ΔH must be multiplied by the same factor.' });
      if (Math.abs(xi) !== 1) variants.push({ i: i, total: ans - dHs[i] + s.dH * Math.sign(xi) / Math.abs(xi), msg: 'Multiply step ' + (i + 1) + '’s ΔH by ' + fracText(F(Math.abs(x[i].n), x[i].d)) + '; don’t divide.' });
    });
    var plainSum = steps.reduce(function (a, s, i) { return used[i] ? a + s.dH : a; }, 0);
    variants.push({ total: plainSum, msg: 'It looks like you added the original ΔH values. Each one must be reversed and multiplied the same way as its equation.' });

    var text = p.text && String(p.text).trim() ? p.text : 'Use the equations below to find ΔH for the target reaction.';
    return {
      id: p.id, level: +p.level, target: target, steps: steps, x: x, used: used, dHs: dHs, answer: ans, hints: hints, variants: variants, keys: keys, info: info, text: text
    };
  }

  // ---------- checks ----------
  // student manipulation: [{rev: bool, mult: string}]
  function combine(sol, choices) {
    var net = {}, err = null, xs = [];
    sol.steps.forEach(function (s, i) {
      var ch = choices[i] || {}, m = String(ch.mult === undefined ? '1' : ch.mult).trim() === '' ? F(0) : parseFrac(ch.mult);
      if (!m || m.n < 0) { err = 'Step ' + (i + 1) + ': type a positive number such as 2, ½ or 3/2 (or 0 to leave the step out).'; m = F(0); }
      var x = ch.rev ? F(-m.n, m.d) : m; xs.push(x);
      for (var k in s.net) net[k] = add(net[k] || F(0), mul(s.net[k], x));
    });
    // full sums of each side (before cancelling)
    var Ls = {}, Rs = {};
    sol.steps.forEach(function (s, i) {
      if (isZero(xs[i])) return;
      var sc = scaledSides(s, xs[i]);
      sc.L.forEach(function (t) { Ls[t.sp.key] = add(Ls[t.sp.key] || F(0), t.c); });
      sc.R.forEach(function (t) { Rs[t.sp.key] = add(Rs[t.sp.key] || F(0), t.c); });
    });
    return { net: net, xs: xs, err: err, Ls: Ls, Rs: Rs };
  }
  function compare(sol, net) {
    var bad = [];
    sol.keys.forEach(function (k) {
      var have = net[k] || F(0), want = sol.target.net[k] || F(0);
      if (num(have) === num(want)) return;
      var desc = function (c) { return isZero(c) ? 'none' : fracText(F(Math.abs(c.n), c.d)) + ' as a ' + (c.n > 0 ? 'product' : 'reactant'); };
      bad.push({ key: k, msg: spHTML(sol.info[k]) + ': your sum has ' + desc(have) + '; the target has ' + desc(want) + '.' });
    });
    return bad;
  }
  function checkStepDH(sol, i, raw) {
    var v = parseNum(raw), want = sol.dHs[i], s = sol.steps[i], x = num(sol.x[i]);
    if (String(raw).trim() === '') return { ok: false, msg: 'Fill this in.' };
    if (!isFinite(v)) return { ok: false, msg: 'Not a number.' };
    if (within(v, want, TOL)) return { ok: true };
    if (Math.abs(x) !== 1 && within(v, Math.sign(x) * s.dH, TOL)) return { ok: false, msg: 'Multiply by ' + fracText(F(Math.abs(sol.x[i].n), sol.x[i].d)) + ' too.' };
    if (within(v, -want, TOL)) return { ok: false, msg: x < 0 ? 'You reversed this equation, so change the sign of ΔH.' : 'This step isn’t reversed, so ΔH keeps its sign.' };
    if (Math.abs(x) !== 1 && within(v, s.dH, TOL)) return { ok: false, msg: 'That’s the original ΔH. Apply the same changes you made to the equation.' };
    if (Math.abs(x) !== 1 && within(v, s.dH * Math.sign(x) / Math.abs(x), TOL)) return { ok: false, msg: 'Multiply by ' + fracText(F(Math.abs(sol.x[i].n), sol.x[i].d)) + '; don’t divide.' };
    return { ok: false, msg: 'Apply the same changes as the equation: reversing flips the sign, and multiplying the equation multiplies ΔH.' };
  }
  function checkTotal(sol, raw) {
    var v = parseNum(raw);
    if (String(raw).trim() === '') return { ok: false, empty: true, msg: 'Enter a number.' };
    if (!isFinite(v)) return { ok: false, msg: 'I can’t read that as a number. Type it like −802.5, without units.' };
    if (within(v, sol.answer, TOL)) return { ok: true };
    for (var j = 0; j < sol.variants.length; j++) { var vr = sol.variants[j]; if (!within(vr.total, sol.answer, TOL) && within(v, vr.total, TOL)) return { ok: false, msg: vr.msg }; }
    if (within(v, -sol.answer, TOL)) return { ok: false, msg: 'Right size, wrong sign. Check which steps were reversed.' };
    return { ok: false, msg: 'Not quite. Add up the ΔH values of your adjusted steps.' };
  }

  // ---------- validation ----------
  var COLUMNS = ['id', 'level', 'target', 'step1', 'dH1', 'step2', 'dH2', 'step3', 'dH3', 'step4', 'dH4', 'step5', 'dH5', 'text'];
  function validate(p) {
    var errs = [];
    if (!p.id) errs.push('missing id');
    if (!(+p.level >= 1 && +p.level <= 5)) errs.push('level must be 1–5');
    if (!p.target) { errs.push('missing target'); return errs; }
    try { var t = parseEq(p.target); if (t.unbalanced.length) errs.push('target isn’t balanced (' + t.unbalanced.join(', ') + ')'); } catch (e) { errs.push('target: ' + e.message); }
    var n = 0;
    for (var i = 1; i <= 6; i++) {
      if (!p['step' + i]) continue; n++;
      try { var e = parseEq(p['step' + i]); if (e.unbalanced.length) errs.push('step' + i + ' isn’t balanced (' + e.unbalanced.join(', ') + ')'); } catch (er) { errs.push('step' + i + ': ' + er.message); }
      if (!isFinite(parseNum(p['dH' + i]))) errs.push('dH' + i + ' is missing or not a number');
    }
    if (!n) errs.push('no steps');
    if (!errs.length) { try { solve(p); } catch (er) { errs.push(er.message); } }
    return errs;
  }

  return {
    F: F, fracText: fracText, parseFrac: parseFrac, num: num, parseEq: parseEq, eqHTML: eqHTML, sideHTML: sideHTML, spHTML: spHTML, termHTML: termHTML,
    scaledSides: scaledSides, netToSides: netToSides, parseNum: parseNum, fmt: fmt, sgn: sgn, within: within, LEVELS: LEVELS, COLUMNS: COLUMNS,
    solve: solve, combine: combine, compare: compare, checkStepDH: checkStepDH, checkTotal: checkTotal, validate: validate, isZero: isZero
  };
})();
if (typeof module !== 'undefined') module.exports = HLE;
