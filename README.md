# Hess’s Law Builder

A student tool for combining given thermochemical equations (reverse, scale, add) to find ΔH for a target reaction.

- **Review**: Hess’s law, the two rules, a strategy, the formation-reaction shortcut, worked examples.
- **Coaching**: flip and scale each step with a live sum and cancellation → adjust each ΔH → add them up, with an enthalpy-path diagram.
- **Testing**: final answer only, five levels, session score.
- **Instructor**: upload a .csv or tab-delimited .txt; the tool checks balance and solves every row itself.

`index.html` is built from `src/` with `python3 build.py`. Tests: `node test/solve_all.js`, `python3 test/browser_test.py`.
