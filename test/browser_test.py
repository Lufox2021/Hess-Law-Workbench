"""Runs every problem through Coaching and Testing in a browser. Run: python3 test/browser_test.py"""
import sys, pathlib
from playwright.sync_api import sync_playwright
url = (pathlib.Path(__file__).resolve().parent.parent / 'index.html').as_uri()
errors, fails = [], 0
with sync_playwright() as pw:
    b = pw.chromium.launch(); pg = b.new_page(viewport={'width': 1280, 'height': 1000})
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    pg.goto(url); pg.wait_for_selector('#cPick option', state='attached')
    ids = pg.eval_on_selector_all('#cPick option', 'os => os.map(o => o.value)')
    for i, pid in enumerate(ids):
        pg.select_option('#cPick', pid)
        s = pg.evaluate('''id => { const s = HLE.solve(HL_PROBLEMS.find(x => x.id === id));
          return {x: s.x.map(x => [x.n, x.d]), used: s.used, dHs: s.dHs, ans: s.answer}; }''', pid)
        if i == 0:
            pg.click('#bCheck'); pg.click('#bCheck'); assert pg.locator('#bFb.bad').count() == 1
        for k, (n, d) in enumerate(s['x']):
            if (n < 0) != pg.is_checked(f'[data-rev="{k}"]'): pg.click(f'[data-rev="{k}"]')
            pg.fill(f'[data-m="{k}"]', f'{abs(n)}/{d}' if d != 1 else str(abs(n)))
        pg.click('#bCheck')
        if pg.locator('#bFb.ok').count() != 1: print('✗', pid, 'build', pg.inner_text('#bFb')); fails += 1; continue
        for k, u in enumerate(s['used']):
            if u: pg.fill(f'[data-dh="{k}"]', repr(s['dHs'][k]))
        pg.click('#dCheck')
        if pg.locator('#dFb.ok').count() != 1: print('✗', pid, 'dH'); fails += 1; continue
        if i == 0:
            pg.fill('#tIn', '99999'); pg.click('#tCk'); assert pg.locator('#tFb.bad').count() == 1
        pg.fill('#tIn', repr(s['ans'])); pg.click('#tCk')
        if pg.locator('.summary').count() != 1: print('✗', pid, 'total'); fails += 1; continue
        print('✓', pid)
        if pid in ('H3-01', 'H4-02'): pg.screenshot(path=f'/tmp/hl_{pid}.png', full_page=True)
    pg.click('nav button[data-tab=test]')
    tid = pg.evaluate("() => document.querySelector('#tBody .pid').textContent.split(' ')[0]")
    s = pg.evaluate('id => { const s = HLE.solve(HL_PROBLEMS.find(x => x.id === id)); return {a: s.answer, v: s.variants.map(v => v.total)}; }', tid)
    pg.fill('#tAns', repr(s['v'][-1])); pg.click('#tCheck'); print('Testing wrong:', pg.inner_text('#tFb'))
    pg.fill('#tAns', repr(s['a'])); pg.click('#tCheck'); print('Testing right:', pg.inner_text('#tFb'))
    pg.click('nav button[data-tab=review]'); pg.screenshot(path='/tmp/hl_review.png', full_page=True)
    pg.click('nav button[data-tab=instr]')
    pg.set_input_files('#iFile', files=[{'name': 't.csv', 'mimeType': 'text/csv', 'buffer': b'id,level,target,step1,dH1,step2,dH2\nX-01,2,C(s) + 1/2O2(g) -> CO(g),C(s) + O2(g) -> CO2(g),-393.5,CO(g) + 1/2O2(g) -> CO2(g),-283.0\nX-02,2,H2(g) + O2(g) -> H2O(l),H2(g) + 1/2O2(g) -> H2O(l),-285.8,,\nX-03,2,N2(g) -> 2N(g),H2(g) + 1/2O2(g) -> H2O(l),-285.8,,\n'}])
    pg.wait_for_selector('#iRes table'); print('Upload:', pg.inner_text('#iRes')[:500])
    b.close()
print('errors:', errors); print('fails:', fails); sys.exit(1 if fails or errors else 0)
