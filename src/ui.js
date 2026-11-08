/* Hess's Law Builder — page code */
(function () {
  'use strict';
  var H = HLE, fmt = H.fmt, sgn = H.sgn;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('hlb_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('hlb_' + k, JSON.stringify(v)); } catch (e) { } }
  };
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function plain(s) { return String(s).replace(/<[^>]+>/g, ''); }

  var BASE = HL_PROBLEMS.slice(), problems = [], byId = {};
  function mergeProblems() {
    var up = store.get('uploads', []), map = {}, order = [];
    BASE.forEach(function (p) { map[p.id] = p; order.push(p.id); });
    up.forEach(function (p) { if (!map[p.id]) order.push(p.id); map[p.id] = Object.assign({}, p, { uploaded: true }); });
    problems = order.map(function (id) { return map[id]; }).filter(function (p) { try { H.solve(p); return true; } catch (e) { return false; } });
    byId = {}; problems.forEach(function (p) { byId[p.id] = p; });
  }
  function inLevel(lv) { return problems.filter(function (p) { return lv === 'all' || String(p.level) === String(lv); }); }
  function randomFrom(list, notId) { var pool = list.filter(function (p) { return p.id !== notId; }); if (!pool.length) pool = list; return pool[Math.floor(Math.random() * pool.length)]; }
  function showTab(name) {
    $$('#nav button').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === name); });
    $$('.tab').forEach(function (t) { t.classList.toggle('on', t.id === 'tab-' + name); }); store.set('tab', name);
  }
  $('#nav').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) showTab(b.dataset.tab); });
  function levelChips(cur) {
    var h = '<button class="chip' + (cur === 'all' ? ' on' : '') + '" data-lv="all">All<span class="n">' + problems.length + '</span></button>';
    [1, 2, 3, 4, 5].forEach(function (l) { h += '<button class="chip' + (String(cur) === String(l) ? ' on' : '') + '" data-lv="' + l + '">' + l + ' · ' + H.LEVELS[l] + '<span class="n">' + inLevel(l).length + '</span></button>'; });
    return h;
  }
  function stepTag(s, i) {
    var x = s.x[i], rev = x.n < 0, m = H.F(Math.abs(x.n), x.d);
    var parts = []; if (rev) parts.push('reversed'); if (!(m.n === 1 && m.d === 1)) parts.push('× ' + H.fracText(m));
    return parts.length ? parts.join(', ') : 'as written';
  }
  function problemCard(s, p) {
    return '<div class="card"><div class="pid">' + esc(p.id) + ' · Level ' + p.level + (p.uploaded ? ' · <span class="tag">uploaded</span>' : '') + '</div>' +
      '<div class="ptext">' + s.text + '</div>' +
      '<div style="margin:10px 0 4px"><b>Target:</b> <span class="eqbig">' + H.eqHTML(s.target) + ' &nbsp; ΔH = ?</span></div>' +
      '<table class="steps" style="margin-top:8px"><tr><th>Given</th><th>Equation</th><th>ΔH (kJ)</th></tr>' +
      s.steps.map(function (st, i) { return '<tr><td>Step ' + (i + 1) + '</td><td class="eqn2">' + H.eqHTML(st) + '</td><td>' + fmt(st.dH) + '</td></tr>'; }).join('') + '</table></div>';
  }

  // ---------- enthalpy path diagram ----------
  var svgN = 0;
  function diagram(s) {
    var id = ++svgN, W = 520, H_ = 300, top = 30, bot = H_ - 26;
    var idx = s.steps.map(function (_, i) { return i; }).filter(function (i) { return s.used[i]; });
    var E = [0]; idx.forEach(function (i) { E.push(E[E.length - 1] + s.dHs[i]); });
    var mx = Math.max.apply(null, E), mn = Math.min.apply(null, E); if (mx === mn) { mx += 1; mn -= 1; }
    var Y = function (e) { return top + (mx - e) / (mx - mn) * (bot - top); };
    var n = idx.length, X = function (j) { return 110 + j * ((W - 200) / Math.max(n, 1)); };
    var g = '<svg viewBox="0 0 ' + W + ' ' + H_ + '" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,Arial,sans-serif" font-size="11" style="width:100%;max-width:560px;height:auto;background:#fbfaf8;border:1px solid var(--line);border-radius:8px">';
    g += '<defs>' + ['u:#c2410c', 'd:#1c64b0', 'k:#2b7a3d'].map(function (z) { var a = z.split(':'); return '<marker id="' + a[0] + id + '" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="' + a[1] + '"/></marker>'; }).join('') + '</defs>';
    g += '<text x="8" y="16" fill="#5f6b7a">Enthalpy (kJ) ↑</text>';
    for (var j = 0; j <= n; j++) {
      var x1 = j === 0 ? 20 : X(j) - 12, x2 = j === n ? W - 12 : X(j + 1) + 12;
      g += '<line x1="' + x1 + '" x2="' + x2 + '" y1="' + Y(E[j]) + '" y2="' + Y(E[j]) + '" stroke="#333" stroke-width="1.5"/>';
    }
    g += '<text x="22" y="' + (Y(0) - 5) + '" font-size="10.5">target reactants</text>';
    g += '<text x="' + (W - 14) + '" y="' + (Y(E[n]) + 13) + '" font-size="10.5" text-anchor="end">target products</text>';
    idx.forEach(function (i, k) {
      var e0 = E[k], e1 = E[k + 1], up = e1 > e0, col = up ? '#c2410c' : '#1c64b0', x = X(k + 1);
      g += '<line x1="' + x + '" x2="' + x + '" y1="' + Y(e0) + '" y2="' + (Y(e1) + (up ? 2 : -2)) + '" stroke="' + col + '" stroke-width="2.4" marker-end="url(#' + (up ? 'u' : 'd') + id + ')"/>';
      var ym = Math.abs(Y(e1) - Y(e0)) < 28 ? Math.min(Y(e0), Y(e1)) - 18 : (Y(e0) + Y(e1)) / 2;
      var last = k === n - 1, tx = last ? x - 5 : x + 5, an = last ? ' text-anchor="end"' : '';
      g += '<text x="' + tx + '" y="' + ym + '" fill="' + col + '" font-weight="600"' + an + '>Step ' + (i + 1) + '</text><text x="' + tx + '" y="' + (ym + 12) + '" fill="' + col + '"' + an + '>' + sgn(s.dHs[i]) + '</text>';
    });
    var up = E[n] > 0;
    g += '<line x1="60" x2="60" y1="' + Y(0) + '" y2="' + (Y(E[n]) + (up ? 2 : -2)) + '" stroke="#2b7a3d" stroke-width="2.4" stroke-dasharray="6 3" marker-end="url(#k' + id + ')"/>';
    g += '<line x1="56" x2="' + (X(n) + 12) + '" y1="' + Y(E[n]) + '" y2="' + Y(E[n]) + '" stroke="#2b7a3d" stroke-width="1" stroke-dasharray="3 3"/>';
    g += '<text x="65" y="' + ((Y(0) + Y(E[n])) / 2) + '" fill="#2b7a3d" font-weight="600">ΔH(rxn)</text><text x="65" y="' + ((Y(0) + Y(E[n])) / 2 + 12) + '" fill="#2b7a3d">' + sgn(s.answer) + '</text>';
    return g + '</svg><div class="small muted" style="margin-top:4px">Any path from the target reactants to the target products gives the same ΔH (green, dashed): enthalpy is a state function.</div>';
  }

  // ================= COACHING =================
  var C = { level: store.get('cLevel', 'all') };
  function coachShell() {
    $('#tab-coach').innerHTML = '<div class="card"><div class="chips" id="cLv"></div><div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;align-items:center"><select id="cPick" style="max-width:560px"></select><button class="btn alt" id="cRand">Pick one for me</button></div></div><div id="cBody"></div>';
    $('#cLv').addEventListener('click', function (e) { var b = e.target.closest('[data-lv]'); if (!b) return; C.level = b.dataset.lv; store.set('cLevel', C.level); fillPicker(); var l = inLevel(C.level); if (!C.p || l.indexOf(C.p) < 0) openCoach(l[0].id); });
    $('#cPick').addEventListener('change', function () { openCoach(this.value); });
    $('#cRand').addEventListener('click', function () { openCoach(randomFrom(inLevel(C.level), C.p && C.p.id).id); });
  }
  function fillPicker() {
    $('#cLv').innerHTML = levelChips(C.level);
    $('#cPick').innerHTML = inLevel(C.level).map(function (p) { var s = H.solve(p); return '<option value="' + esc(p.id) + '"' + (C.p && C.p.id === p.id ? ' selected' : '') + '>' + esc(p.id) + ' · ' + esc(plain(H.eqHTML(s.target))) + '</option>'; }).join('');
  }
  function openCoach(id) {
    var p = byId[id] || problems[0]; C.p = p; C.s = H.solve(p); store.set('cId', p.id);
    C.tries = { build: 0, dh: 0, total: 0 }; C.shown = {}; C.phase = 'build';
    if (C.level !== 'all' && String(p.level) !== String(C.level)) { C.level = 'all'; store.set('cLevel', 'all'); }
    fillPicker(); renderCoach();
  }
  function renderCoach() {
    var s = C.s;
    var rows = s.steps.map(function (st, i) {
      return '<tr><td>Step ' + (i + 1) + '</td><td><label class="rev"><input type="checkbox" data-rev="' + i + '"> reverse</label></td>' +
        '<td>× <input type="text" class="mult" data-m="' + i + '" value="1" autocomplete="off" style="width:56px;text-align:center;font-family:ui-monospace,Consolas,monospace"></td>' +
        '<td class="eqn2" id="man' + i + '">' + H.eqHTML(st) + '</td></tr><tr><td></td><td colspan="3" class="mini" id="hint' + i + '" style="color:#5a3d00"></td></tr>';
    }).join('');
    $('#cBody').innerHTML = problemCard(s, C.p) +
      '<div class="card" id="cBuild"><h2>1 · Flip and scale the steps so they add up to the target</h2>' +
      '<p class="small muted" style="margin-top:-4px">For each step, choose whether to reverse it and what to multiply it by (2, ½ or 1/2, 3/2…). Use × 0 to leave a step out. The sum updates as you go.</p>' +
      '<table class="steps"><tr><th></th><th>Reverse?</th><th>Multiply</th><th>Your adjusted equation</th></tr>' + rows + '</table>' +
      '<div class="sumbox" id="sumbox"></div>' +
      '<div style="margin-top:10px;display:flex;gap:8px;align-items:center"><button class="btn" id="bCheck">Check my sum</button><span id="bShow"></span></div><div class="fb" id="bFb"></div></div>' +
      '<div class="card" id="cDH"><h2>2 · Adjust each ΔH</h2><div id="dhBody"><p class="muted">Get the equations to add up first.</p></div></div>' +
      '<div class="card" id="cTot"><h2>3 · Add them up</h2><div id="totBody"><p class="muted">Adjust each ΔH first.</p></div></div>';
    $$('#cBuild input').forEach(function (inp) { inp.addEventListener('input', updateSum); inp.addEventListener('change', updateSum); inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') checkBuild(); }); });
    $('#bCheck').addEventListener('click', checkBuild);
    updateSum();
  }
  function choices() { return C.s.steps.map(function (_, i) { return { rev: $('[data-rev="' + i + '"]').checked, mult: $('[data-m="' + i + '"]').value }; }); }
  function updateSum() {
    var s = C.s, ch = choices(), comb = H.combine(s, ch);
    s.steps.forEach(function (st, i) {
      var x = comb.xs[i], el = $('#man' + i);
      if (H.isZero(x)) { el.innerHTML = '<span class="muted">(left out)</span>'; return; }
      var sc = H.scaledSides(st, x); el.innerHTML = H.sideHTML(sc.L) + ' → ' + H.sideHTML(sc.R);
    });
    if (comb.err) { $('#sumbox').innerHTML = '<span class="badc">' + comb.err + '</span>'; return; }
    // full sum with cancellations marked
    function sideList(map, other) {
      return Object.keys(map).map(function (k) {
        var c = map[k], o = other[k] || H.F(0), sp = s.info[k];
        if (H.isZero(o)) return H.termHTML(c, sp);
        return '<span class="cancel">' + H.termHTML(c, sp) + '</span>';
      }).join(' + ') || '—';
    }
    var net = H.netToSides(comb.net, s.info), bad = H.compare(s, comb.net);
    var mark = function (terms) { return terms.map(function (t) { var want = s.target.net[t.sp.key]; var ok = bad.every(function (b) { return b.key !== t.sp.key; }); return '<span class="' + (ok ? 'good' : 'badc') + '">' + H.termHTML(t.c, t.sp) + '</span>'; }).join(' + ') || '—'; };
    $('#sumbox').innerHTML = '<div class="lab">Add the adjusted steps (species on both sides are crossed out):</div><div class="eqn2">' + sideList(comb.Ls, comb.Rs) + ' → ' + sideList(comb.Rs, comb.Ls) + '</div>' +
      '<div class="lab">After canceling:</div><div class="eqn2">' + mark(net.L) + ' → ' + mark(net.R) + '</div>' +
      '<div class="lab">Target:</div><div class="eqn2">' + H.eqHTML(s.target) + '</div>' +
      (bad.length ? '' : '<div class="good" style="margin-top:4px">✓ Matches the target.</div>');
  }
  function checkBuild() {
    if (C.phase !== 'build') return;
    var s = C.s, t = ++C.tries.build, comb = H.combine(s, choices());
    if (comb.err) { $('#bFb').className = 'fb bad'; $('#bFb').innerHTML = comb.err; return; }
    var bad = H.compare(s, comb.net);
    if (!bad.length) return buildDone(false);
    $('#bFb').className = 'fb bad';
    $('#bFb').innerHTML = 'Not the target yet:<ul style="margin:4px 0 0 18px;padding:0">' + bad.map(function (b) { return '<li>' + b.msg + '</li>'; }).join('') + '</ul>' +
      (t >= 2 ? '<div class="fb rule">Strategy: find a species in the target that appears in only one step. Reverse that step if the species is on the wrong side, and multiply so its coefficient matches. Hints are shown under each step.</div>' : '');
    if (t >= 2) s.steps.forEach(function (_, i) { $('#hint' + i).innerHTML = s.hints[i]; });
    if (t >= 3) { $('#bShow').innerHTML = '<button class="btn alt" id="bSh">Show me</button>'; $('#bSh').addEventListener('click', function () { buildDone(true); }); }
  }
  function buildDone(shown) {
    var s = C.s; C.shown.build = shown;
    s.steps.forEach(function (_, i) {
      var x = s.x[i]; $('[data-rev="' + i + '"]').checked = x.n < 0;
      var m = H.F(Math.abs(x.n), x.d); $('[data-m="' + i + '"]').value = H.fracText(m).replace('−', '-');
      $('#hint' + i).innerHTML = '';
    });
    updateSum();
    $$('#cBuild input').forEach(function (e) { e.disabled = true; }); $('#bCheck').disabled = true; $('#bShow').innerHTML = '';
    $('#bFb').className = 'fb ok'; $('#bFb').innerHTML = shown ? 'Here is how the steps combine.' : 'The steps add up to the target!';
    C.phase = 'dh'; renderDH();
  }
  function renderDH() {
    var s = C.s;
    var rows = s.steps.map(function (st, i) {
      if (!s.used[i]) return '<tr style="opacity:.45"><td>Step ' + (i + 1) + '</td><td colspan="3">left out</td></tr>';
      return '<tr><td>Step ' + (i + 1) + '</td><td>' + fmt(st.dH) + ' kJ, ' + stepTag(s, i) + '</td><td>ΔH = <input type="text" class="num" data-dh="' + i + '" style="width:110px" autocomplete="off"> kJ</td><td class="mini" id="dhf' + i + '"></td></tr>';
    }).join('');
    $('#dhBody').innerHTML = '<p class="small" style="margin-top:-4px">Do to each ΔH exactly what you did to its equation: reversing changes the sign, and multiplying the equation multiplies ΔH.</p><table class="steps"><tr><th></th><th>Original ΔH, change</th><th>Adjusted ΔH</th><th></th></tr>' + rows + '</table>' +
      '<div style="margin-top:10px;display:flex;gap:8px;align-items:center"><button class="btn" id="dCheck">Check</button><span id="dShow"></span></div><div class="fb" id="dFb"></div>';
    $('#dCheck').addEventListener('click', checkDH);
    $$('#dhBody input').forEach(function (i) { i.addEventListener('keydown', function (e) { if (e.key === 'Enter') checkDH(); }); });
    var f = $('#dhBody input'); if (f) f.focus();
  }
  function checkDH() {
    var s = C.s, t = ++C.tries.dh, all = true;
    s.steps.forEach(function (_, i) {
      if (!s.used[i]) return;
      var inp = $('[data-dh="' + i + '"]'), r = H.checkStepDH(s, i, inp.value);
      inp.classList.toggle('ok', r.ok); inp.classList.toggle('bad', !r.ok); $('#dhf' + i).innerHTML = r.ok ? '' : r.msg; if (!r.ok) all = false;
    });
    if (all) return dhDone(false);
    $('#dFb').className = 'fb bad'; $('#dFb').innerHTML = 'Some values need another look.' + (t >= 2 ? '<div class="fb rule">Rule 1: multiply an equation by n → multiply ΔH by n. Rule 2: reverse an equation → change the sign of ΔH.</div>' : '');
    if (t >= 3) { $('#dShow').innerHTML = '<button class="btn alt" id="dSh">Show me</button>'; $('#dSh').addEventListener('click', function () { dhDone(true); }); }
  }
  function dhDone(shown) {
    var s = C.s; C.shown.dh = shown;
    s.steps.forEach(function (_, i) { if (!s.used[i]) return; var inp = $('[data-dh="' + i + '"]'); if (!H.checkStepDH(s, i, inp.value).ok) inp.value = fmt(s.dHs[i]).replace('−', '-'); inp.classList.add('ok'); inp.classList.remove('bad'); inp.disabled = true; $('#dhf' + i).innerHTML = ''; });
    $('#dCheck').disabled = true; $('#dShow').innerHTML = ''; $('#dFb').className = 'fb ok'; $('#dFb').innerHTML = shown ? 'Here are the adjusted values.' : 'All adjusted correctly.';
    C.phase = 'total'; renderTotal();
  }
  function renderTotal() {
    var s = C.s;
    $('#totBody').innerHTML = '<p class="small" style="margin-top:-4px">The equations add up to the target, so their ΔH values add up to ΔH for the target (Hess’s law).</p>' +
      '<div class="row" style="display:flex;gap:10px;align-items:center"><span class="sym" style="font-family:Georgia,serif;font-size:16px">ΔH<sub>rxn</sub> =</span><input type="text" class="num" id="tIn" autocomplete="off"><span class="muted">kJ</span><button class="btn" id="tCk">Check</button></div><div class="fb" id="tFb"></div><div id="tSum"></div>';
    $('#tCk').addEventListener('click', checkTot); $('#tIn').addEventListener('keydown', function (e) { if (e.key === 'Enter') checkTot(); }); $('#tIn').focus();
  }
  function workedLine(s) { return 'ΔH<sub>rxn</sub> = ' + s.steps.map(function (_, i) { return s.used[i] ? '(' + sgn(s.dHs[i]) + ')' : null; }).filter(Boolean).join(' + ') + ' = ' + fmt(s.answer) + ' kJ'; }
  function checkTot() {
    if (C.phase !== 'total') return;
    var s = C.s, r = H.checkTotal(s, $('#tIn').value), fb = $('#tFb');
    if (r.empty) { fb.className = 'fb bad'; fb.innerHTML = r.msg; return; }
    if (r.ok) return totDone(false);
    var t = ++C.tries.total; $('#tIn').classList.add('bad'); fb.className = 'fb bad';
    fb.innerHTML = r.msg + (t >= 2 ? '<div class="fb rule">Add the adjusted ΔH values from part 2, keeping their signs.</div>' : '') + (t >= 3 ? '<div style="margin-top:6px"><button class="btn alt" id="tSh">Show me</button></div>' : '');
    var b = $('#tSh'); if (b) b.addEventListener('click', function () { totDone(true); });
  }
  function totDone(shown) {
    var s = C.s; C.shown.total = shown; C.phase = 'done';
    $('#tIn').value = fmt(s.answer).replace('−', '-'); $('#tIn').disabled = true; $('#tIn').classList.add('ok'); $('#tCk').disabled = true;
    $('#tFb').className = 'fb ok'; $('#tFb').innerHTML = (shown ? '' : '✓ ') + workedLine(s);
    var n = ['build', 'dh', 'total'].filter(function (k) { return C.shown[k]; }).length;
    $('#tSum').innerHTML = '<div class="summary" style="margin-top:10px"><div class="big">ΔH<sub>rxn</sub> = ' + fmt(s.answer) + ' kJ <span class="tag ' + (s.answer < 0 ? 'exo">exothermic' : 'endo">endothermic') + '</span></div>' +
      '<div style="margin-top:8px">' + diagram(s) + '</div>' +
      '<p class="small muted" style="margin:8px 0">' + (n ? n + ' part' + (n > 1 ? 's were' : ' was') + ' shown.' : 'Every part done on your own.') + '</p>' +
      '<button class="btn" id="cNext">Next problem</button> <button class="btn alt" id="cToTest">Test myself on this level</button></div>';
    $('#cNext').addEventListener('click', function () { openCoach(randomFrom(inLevel(C.level), C.p.id).id); window.scrollTo(0, 0); });
    $('#cToTest').addEventListener('click', function () { showTab('test'); openTest(randomFrom(inLevel(C.p.level), C.p.id).id); });
  }

  // ================= TESTING =================
  var T = { level: store.get('tLevel', 'all'), score: { solved: 0, tried: 0, first: 0 } };
  function testShell() {
    $('#tab-test').innerHTML = '<div class="card"><div class="chips" id="tLv"></div><div style="margin-top:10px;display:flex;gap:16px;align-items:center;flex-wrap:wrap"><button class="btn" id="tNew">New problem</button><div class="score" id="tScore"></div></div></div><div id="tBody"></div>';
    $('#tLv').addEventListener('click', function (e) { var b = e.target.closest('[data-lv]'); if (!b) return; T.level = b.dataset.lv; store.set('tLevel', T.level); openTest(randomFrom(inLevel(T.level), T.p && T.p.id).id); });
    $('#tNew').addEventListener('click', function () { openTest(randomFrom(inLevel(T.level), T.p && T.p.id).id); });
  }
  function renderScore() { var s = T.score; $('#tScore').innerHTML = '<span>Solved <b>' + s.solved + '</b></span><span>Attempted <b>' + s.tried + '</b></span><span>First try <b>' + s.first + '</b></span>'; }
  function openTest(id) {
    var p = byId[id]; T.p = p; T.s = H.solve(p); T.tries = 0; T.finished = false; T.counted = false;
    $('#tLv').innerHTML = levelChips(T.level);
    $('#tBody').innerHTML = problemCard(T.s, p).replace(/<\/div>$/, '') +
      '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:14px"><span style="font-family:Georgia,serif;font-size:17px">ΔH<sub>rxn</sub> =</span><input type="text" class="num" id="tAns" autocomplete="off"><span class="muted">kJ</span><button class="btn" id="tCheck">Check</button></div>' +
      '<div class="fb" id="tFb"></div><div id="tMore"></div><div style="margin-top:12px"><button class="btn alt" id="tCoach">Coach me through this one</button></div></div>';
    $('#tCheck').addEventListener('click', checkTest); $('#tAns').addEventListener('keydown', function (e) { if (e.key === 'Enter') checkTest(); });
    $('#tCoach').addEventListener('click', function () { showTab('coach'); openCoach(p.id); window.scrollTo(0, 0); });
    renderScore(); $('#tAns').focus();
  }
  function planHTML(s) { return '<div class="plan"><b>How the steps combine</b><ol>' + s.steps.map(function (st, i) { return '<li>Step ' + (i + 1) + ': ' + (s.used[i] ? stepTag(s, i) : 'not needed') + '</li>'; }).join('') + '</ol></div>'; }
  function checkTest() {
    if (T.finished) return;
    var r = H.checkTotal(T.s, $('#tAns').value), fb = $('#tFb');
    if (r.empty) { fb.className = 'fb bad'; fb.innerHTML = r.msg; return; }
    if (!T.counted) { T.counted = true; T.score.tried++; } T.tries++;
    if (r.ok) {
      T.finished = true; T.score.solved++; if (T.tries === 1) T.score.first++;
      $('#tAns').classList.add('ok'); $('#tAns').classList.remove('bad'); fb.className = 'fb ok'; fb.innerHTML = '✓ Correct' + (T.tries === 1 ? ' on the first try!' : '.') + ' ΔH = ' + fmt(T.s.answer) + ' kJ';
      $('#tMore').innerHTML = '<details style="margin-top:8px"><summary>See the solution</summary>' + planHTML(T.s) + '<div class="worked">' + workedLine(T.s) + '</div></details><button class="btn" id="tNext" style="margin-top:8px">Next problem</button>';
      $('#tNext').addEventListener('click', function () { openTest(randomFrom(inLevel(T.level), T.p.id).id); }); renderScore(); return;
    }
    $('#tAns').classList.add('bad'); fb.className = 'fb bad'; fb.innerHTML = r.msg;
    var more = ''; if (T.tries >= 2) more += planHTML(T.s); if (T.tries >= 3) more += '<div style="margin-top:8px"><button class="btn alt" id="tShow">Show the solution</button></div>';
    $('#tMore').innerHTML = more;
    var sb = $('#tShow'); if (sb) sb.addEventListener('click', function () {
      T.finished = true; $('#tMore').innerHTML = '<div class="summary" style="margin-top:8px"><b>Solution</b>' + planHTML(T.s) + '<div class="worked" style="margin:6px 0">' + workedLine(T.s) + '</div>' + diagram(T.s) + '</div><button class="btn" id="tNext" style="margin-top:8px">Next problem</button>';
      $('#tNext').addEventListener('click', function () { openTest(randomFrom(inLevel(T.level), T.p.id).id); });
    });
    renderScore();
  }

  // ================= REVIEW =================
  function example(id, title, hidden) {
    var p = BASE.filter(function (x) { return x.id === id; })[0]; if (!p) return '';
    var s = H.solve(p);
    var body = '<table class="steps"><tr><th></th><th>Change</th><th>Adjusted equation</th><th>ΔH (kJ)</th></tr>' + s.steps.map(function (st, i) {
      if (!s.used[i]) return '';
      var sc = H.scaledSides(st, s.x[i]); return '<tr><td>Step ' + (i + 1) + '</td><td>' + stepTag(s, i) + '</td><td class="eqn2">' + H.sideHTML(sc.L) + ' → ' + H.sideHTML(sc.R) + '</td><td>' + sgn(s.dHs[i]) + '</td></tr>';
    }).join('') + '<tr><td colspan="2"><b>Sum</b></td><td class="eqn2"><b>' + H.eqHTML(s.target) + '</b></td><td><b>' + fmt(s.answer) + '</b></td></tr></table><div style="margin-top:8px;max-width:560px">' + diagram(s) + '</div>';
    return '<div class="card"><h3 style="margin-top:0">' + title + '</h3><p>' + s.text + '</p><div><b>Target:</b> <span class="eqbig">' + H.eqHTML(s.target) + '</span></div>' +
      '<table class="steps" style="margin:8px 0"><tr><th>Given</th><th>Equation</th><th>ΔH (kJ)</th></tr>' + s.steps.map(function (st, i) { return '<tr><td>Step ' + (i + 1) + '</td><td class="eqn2">' + H.eqHTML(st) + '</td><td>' + fmt(st.dH) + '</td></tr>'; }).join('') + '</table>' +
      (hidden ? '<details><summary>Show the solution</summary>' + body + '</details>' : body) + '</div>';
  }
  function renderReview() {
    $('#tab-review').innerHTML =
      '<div class="card"><h2>Hess’s law</h2><p><b>If a chemical equation can be written as the sum of other equations, its ΔH is the sum of their ΔH values.</b></p>' +
      '<p>This works because enthalpy is a <b>state function</b>: ΔH depends only on where you start and where you end, not on the path in between. So you can find ΔH for a reaction that is hard or impossible to measure (like graphite → diamond, or C + ½O₂ → CO) by adding up reactions you <i>can</i> measure.</p></div>' +
      '<div class="cols"><div class="card"><h2>Rule 1 · Multiply</h2><p>If an equation is multiplied by a factor, ΔH is multiplied by the same factor.</p>' +
      '<div class="eqn">H₂(g) + ½O₂(g) → H₂O(l) &nbsp; ΔH = −285.8 kJ</div><div class="eqn">2H₂(g) + O₂(g) → 2H₂O(l) &nbsp; ΔH = 2 × (−285.8) = −571.6 kJ</div></div>' +
      '<div class="card"><h2>Rule 2 · Reverse</h2><p>If an equation is reversed, ΔH changes sign.</p>' +
      '<div class="eqn">2H₂(g) + O₂(g) → 2H₂O(l) &nbsp; ΔH = −571.6 kJ</div><div class="eqn">2H₂O(l) → 2H₂(g) + O₂(g) &nbsp; ΔH = +571.6 kJ</div></div></div>' +
      '<div class="card"><h2>A strategy that works</h2><ol>' +
      '<li>Write the target at the top.</li>' +
      '<li>Find a species in the target that appears in <b>only one</b> given step. That step must be used so that the species ends up on the same side, with the same coefficient: reverse it if needed, then multiply.</li>' +
      '<li>Repeat for the other target species.</li>' +
      '<li>Add the adjusted equations and cancel species that appear on both sides. Everything left must be exactly the target, including states.</li>' +
      '<li>Adjust each ΔH the same way as its equation, then add.</li></ol>' +
      '<div class="callout">States matter: H₂O(l) and H₂O(g) are different species and don’t cancel each other. C(s, graphite) and C(s, diamond) are different too.</div></div>' +
      '<div class="card"><h2>The formation-reaction shortcut</h2><p>When every step is a <b>formation reaction</b> (one mole of a compound from its elements in their standard states), its ΔH is ΔH°<sub>f</sub> of that compound. Combining them by Hess’s law always gives:</p>' +
      '<div class="eqn">ΔH°<sub>rxn</sub> = Σ n·ΔH°<sub>f</sub>(products) − Σ n·ΔH°<sub>f</sub>(reactants)</div><p>Elements in their standard states (O₂(g), C(s, graphite), N₂(g)…) have ΔH°<sub>f</sub> = 0. Level 5 problems show why the shortcut works.</p></div>' +
      '<h2 style="margin:18px 0 10px">Worked examples</h2>' +
      example('H2-01', 'Example 1 · Forming CO (two steps)') + example('H3-01', 'Example 2 · Combustion of methane (slide 59)') + example('H5-01', 'Example 3 · From formation reactions (slide 61)') +
      example('H3-03', 'You try this one · Forming acetylene', true) +
      '<div class="card"><h2>How to type</h2><ul><li>Multipliers: <kbd>2</kbd>, <kbd>1/2</kbd>, <kbd>½</kbd>, <kbd>0.5</kbd>, <kbd>3/2</kbd>. Use <kbd>0</kbd> to leave a step out.</li><li>ΔH values in kJ, with sign: <kbd>-802.5</kbd> or <kbd>−802.5</kbd>.</li><li>Answers within about 0.6 kJ are accepted.</li></ul></div>';
  }

  // ================= INSTRUCTOR =================
  var TEMPLATE = [
    { id: 'X-01', level: 2, target: 'C(s, graphite) + 1/2O2(g) -> CO(g)', step1: 'C(s, graphite) + O2(g) -> CO2(g)', dH1: '-393.5', step2: 'CO(g) + 1/2O2(g) -> CO2(g)', dH2: '-283.0' },
    { id: 'X-02', level: 3, target: '2C(s, graphite) + 3H2(g) -> C2H6(g)', step1: 'C2H6(g) + 7/2O2(g) -> 2CO2(g) + 3H2O(l)', dH1: '-1560', step2: 'C(s, graphite) + O2(g) -> CO2(g)', dH2: '-393.5', step3: 'H2(g) + 1/2O2(g) -> H2O(l)', dH3: '-285.8' }
  ];
  function csvCell(v) { v = v === undefined || v === null ? '' : String(v); return /[",\n\t]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function toCSV(rows) { return H.COLUMNS.join(',') + '\n' + rows.map(function (r) { return H.COLUMNS.map(function (c) { return csvCell(r[c]); }).join(','); }).join('\n') + '\n'; }
  function parseTable(text) {
    var delim = text.split('\n')[0].indexOf('\t') >= 0 ? '\t' : ',', rows = [], row = [], cell = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
      else if (ch === '"') q = true; else if (ch === delim) { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; } else cell += ch;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    rows = rows.filter(function (r) { return r.some(function (c) { return String(c).trim() !== ''; }); }); if (!rows.length) return [];
    var head = rows[0].map(function (h) { return h.trim(); });
    return rows.slice(1).map(function (r) { var o = {}; head.forEach(function (h, k) { var v = (r[k] || '').trim(); if (v !== '') o[h] = v; }); return o; });
  }
  function offerFile(name, text, mime, box) {
    try { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: mime })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); }, 500); } catch (e) { }
    $('#' + box).innerHTML = '<p class="small muted" style="margin:8px 0 4px">If no file downloaded (downloads are blocked in the claude.ai preview), copy this text into a file named <b>' + esc(name) + '</b>:</p><textarea class="copy" readonly>' + esc(text) + '</textarea>';
  }
  var pending = [];
  function renderInstr() {
    var up = store.get('uploads', []);
    $('#tab-instr').innerHTML =
      '<div class="card"><h2>Problem spreadsheet</h2><p>One row per problem: the target equation and up to five given steps with their ΔH. The tool checks that every equation is balanced, works out how the steps combine, and computes the answer, so there is no answer-key column.</p>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="iTpl">Download template (.csv)</button><button class="btn alt" id="iCur">Download current problems (.csv)</button></div><div id="iBox1"></div>' +
      '<details style="margin-top:10px"><summary>How to write equations</summary><ul class="small"><li>Arrow: <code>-&gt;</code>; between species: <code> + </code> (spaces around the plus).</li><li>Every species needs a state: <code>(g)</code>, <code>(l)</code>, <code>(s)</code>, <code>(aq)</code>, or a form such as <code>(s, graphite)</code>.</li><li>Coefficients: <code>2</code>, <code>1/2</code>, <code>3/2</code>, <code>½</code> written right before the formula, e.g. <code>1/2O2(g)</code>.</li><li>Columns: <code>' + H.COLUMNS.join(', ') + '</code>. ΔH in kJ with sign. <code>text</code> is optional.</li><li>A row is flagged if an equation is unbalanced, if the steps can’t make the target, or if they can make it more than one way.</li></ul></details></div>' +
      '<div class="card"><h2>Upload problems</h2><p>A .csv or tab-delimited .txt file with the columns above.</p><input type="file" id="iFile" accept=".csv,.txt,.tsv"><div id="iRes"></div></div>' +
      '<div class="card"><h2>Problems saved in this browser</h2><p>' + (up.length ? up.length + ' uploaded problem' + (up.length > 1 ? 's' : '') + ' (they replace built-in problems with the same id).' : 'None. Students see the built-in set (' + problems.length + ' problems).') + '</p>' + (up.length ? '<button class="btn alt" id="iRemove">Remove uploaded problems</button>' : '') +
      '<h3>Updating what students see</h3><ol class="small"><li>Edit the spreadsheet (start from “Download current problems” to keep the built-in set).</li><li>Upload it here and fix any flagged rows.</li><li>Click <b>Download problems.json</b>.</li><li>On GitHub: <b>Add file → Upload files</b>, upload problems.json, and commit. It replaces the whole problem set.</li></ol></div>';
    $('#iTpl').addEventListener('click', function () { offerFile('hess-template.csv', toCSV(TEMPLATE), 'text/csv', 'iBox1'); });
    $('#iCur').addEventListener('click', function () { offerFile('hess-problems.csv', toCSV(problems), 'text/csv', 'iBox1'); });
    $('#iFile').addEventListener('change', function () { var f = this.files[0]; if (!f) return; var rd = new FileReader(); rd.onload = function () { handleUpload(String(rd.result)); }; rd.readAsText(f); });
    var rm = $('#iRemove'); if (rm) rm.addEventListener('click', function () { store.set('uploads', []); mergeProblems(); refreshAll(); renderInstr(); });
  }
  function handleUpload(text) {
    var rows = parseTable(text), seen = {}, h = ''; pending = [];
    rows.forEach(function (r, k) {
      var errs = H.validate(r); if (r.id && seen[r.id]) errs.push('duplicate id'); seen[r.id] = 1;
      var res = ''; if (!errs.length) { var s = H.solve(r); res = 'ΔH = ' + plain(fmt(s.answer)) + ' kJ (steps: ' + s.x.map(function (x) { return plain(H.fracText(x)); }).join(', ') + ')'; pending.push(r); }
      h += '<tr><td>' + (k + 2) + '</td><td>' + esc(r.id || '') + '</td><td>' + (errs.length ? '<span style="color:var(--bad)">✗ ' + esc(errs.join('; ')) + '</span>' : '<span style="color:var(--ok)">✓</span> ' + esc(res)) + '</td></tr>';
    });
    $('#iRes').innerHTML = '<p>' + rows.length + ' rows read, ' + pending.length + ' ready.</p><table class="up"><tr><th>Row</th><th>id</th><th>Result</th></tr>' + h + '</table>' +
      (pending.length ? '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="iTry">Try these in this browser</button><button class="btn alt" id="iJson">Download problems.json</button></div><div id="iBox2"></div>' : '');
    var tb = $('#iTry');
    if (tb) {
      tb.addEventListener('click', function () { var up = store.get('uploads', []), map = {}; up.forEach(function (p) { map[p.id] = p; }); pending.forEach(function (p) { map[p.id] = p; }); store.set('uploads', Object.keys(map).map(function (k) { return map[k]; })); mergeProblems(); refreshAll(); renderInstr(); $('#iRes').innerHTML = '<div class="fb ok">' + pending.length + ' problems saved in this browser. Open Coaching or Testing to try them.</div>'; });
      $('#iJson').addEventListener('click', function () { offerFile('problems.json', JSON.stringify(pending, null, 1), 'application/json', 'iBox2'); });
    }
  }

  function refreshAll() { fillPicker(); if (!C.p || !byId[C.p.id]) openCoach(problems[0].id); $('#tLv').innerHTML = levelChips(T.level); }
  function start() {
    mergeProblems(); renderReview(); coachShell(); testShell(); renderInstr();
    var last = store.get('cId', null); openCoach(byId[last] ? last : (inLevel(C.level)[0] || problems[0]).id);
    openTest(randomFrom(inLevel(T.level)).id); showTab(store.get('tab', 'coach'));
  }
  var started = false; function go() { if (!started) { started = true; start(); } }
  try {
    if (location.protocol.indexOf('http') === 0 && typeof fetch === 'function') {
      var timer = setTimeout(go, 1500);
      fetch('problems.json', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { if (Array.isArray(j) && j.length && !started) BASE = j; clearTimeout(timer); go(); }).catch(function () { clearTimeout(timer); go(); });
    } else go();
  } catch (e) { go(); }
})();
