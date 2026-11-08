/* Hess's Law Builder — built-in problems (ΔH in kJ). Equations: "->" arrow, " + " between species, states in parentheses. */
var HL_PROBLEMS = [
  // ---- Level 1: one or two steps ----
  { id: 'H1-01', level: 1, target: '6H2(g) + 3O2(g) -> 6H2O(l)', step1: 'H2(g) + 1/2O2(g) -> H2O(l)', dH1: '-285.8',
    text: 'Rule 1 (slide 56): if an equation is multiplied by a factor, ΔH is multiplied by the same factor. Find ΔH for the target.' },
  { id: 'H1-02', level: 1, target: '2H2O(l) -> 2H2(g) + O2(g)', step1: '2H2(g) + O2(g) -> 2H2O(l)', dH1: '-571.6',
    text: 'Rule 2 (slide 57): if an equation is reversed, ΔH changes sign. Find ΔH for the target.' },
  { id: 'H1-03', level: 1, target: '2CO(g) + O2(g) -> 2CO2(g)', step1: 'CO(g) + 1/2O2(g) -> CO2(g)', dH1: '-283.0' },
  { id: 'H1-04', level: 1, target: 'H2O(l) -> H2O(g)', step1: 'H2(g) + 1/2O2(g) -> H2O(l)', dH1: '-285.8', step2: 'H2(g) + 1/2O2(g) -> H2O(g)', dH2: '-241.8',
    text: 'Find ΔH for the vaporization of water.' },
  { id: 'H1-05', level: 1, target: 'C(s, graphite) -> C(s, diamond)', step1: 'C(s, graphite) + O2(g) -> CO2(g)', dH1: '-393.5', step2: 'C(s, diamond) + O2(g) -> CO2(g)', dH2: '-395.4',
    text: 'Graphite can’t be turned into diamond in a calorimeter, but Hess’s law gives ΔH anyway. Find ΔH for the target.' },
  // ---- Level 2: two steps ----
  { id: 'H2-01', level: 2, target: 'C(s, graphite) + 1/2O2(g) -> CO(g)', step1: 'C(s, graphite) + O2(g) -> CO2(g)', dH1: '-393.5', step2: 'CO(g) + 1/2O2(g) -> CO2(g)', dH2: '-283.0',
    text: 'Burning carbon always makes some CO2, so ΔH for forming CO can’t be measured directly. Find it with Hess’s law.' },
  { id: 'H2-02', level: 2, target: '2SO2(g) + O2(g) -> 2SO3(g)', step1: 'S(s) + O2(g) -> SO2(g)', dH1: '-296.8', step2: '2S(s) + 3O2(g) -> 2SO3(g)', dH2: '-791.4' },
  { id: 'H2-03', level: 2, target: 'N2(g) + 2O2(g) -> 2NO2(g)', step1: 'N2(g) + O2(g) -> 2NO(g)', dH1: '182.6', step2: '2NO(g) + O2(g) -> 2NO2(g)', dH2: '-114.2' },
  { id: 'H2-04', level: 2, target: 'Ca(s) + 1/2O2(g) + CO2(g) -> CaCO3(s)', step1: 'Ca(s) + 1/2O2(g) -> CaO(s)', dH1: '-635.1', step2: 'CaCO3(s) -> CaO(s) + CO2(g)', dH2: '178.3' },
  { id: 'H2-05', level: 2, target: 'P4(s) + 10Cl2(g) -> 4PCl5(s)', step1: 'P4(s) + 6Cl2(g) -> 4PCl3(l)', dH1: '-1280', step2: 'PCl3(l) + Cl2(g) -> PCl5(s)', dH2: '-124' },
  // ---- Level 3: three steps ----
  { id: 'H3-01', level: 3, target: 'CH4(g) + 2O2(g) -> CO2(g) + 2H2O(g)', step1: 'C(s, graphite) + 2H2(g) -> CH4(g)', dH1: '-74.6', step2: 'C(s, graphite) + O2(g) -> CO2(g)', dH2: '-393.5', step3: 'H2(g) + 1/2O2(g) -> H2O(g)', dH3: '-241.8',
    text: 'Find ΔH for the combustion of methane. (Slide 59)' },
  { id: 'H3-02', level: 3, target: 'C(s, graphite) + 2H2(g) -> CH4(g)', step1: 'CH4(g) + 2O2(g) -> CO2(g) + 2H2O(l)', dH1: '-890.3', step2: 'C(s, graphite) + O2(g) -> CO2(g)', dH2: '-393.5', step3: 'H2(g) + 1/2O2(g) -> H2O(l)', dH3: '-285.8',
    text: 'Carbon and hydrogen don’t react cleanly to make methane, but all three burn. Use the combustion data to find ΔH for forming methane.' },
  { id: 'H3-03', level: 3, target: '2C(s, graphite) + H2(g) -> C2H2(g)', step1: 'C2H2(g) + 5/2O2(g) -> 2CO2(g) + H2O(l)', dH1: '-1299.6', step2: 'C(s, graphite) + O2(g) -> CO2(g)', dH2: '-393.5', step3: 'H2(g) + 1/2O2(g) -> H2O(l)', dH3: '-285.8' },
  { id: 'H3-04', level: 3, target: 'C2H4(g) + H2(g) -> C2H6(g)', step1: 'C2H4(g) + 3O2(g) -> 2CO2(g) + 2H2O(l)', dH1: '-1411', step2: 'C2H6(g) + 7/2O2(g) -> 2CO2(g) + 3H2O(l)', dH2: '-1560', step3: 'H2(g) + 1/2O2(g) -> H2O(l)', dH3: '-285.8' },
  { id: 'H3-05', level: 3, target: 'C(s, graphite) + 2S(s) -> CS2(l)', step1: 'C(s, graphite) + O2(g) -> CO2(g)', dH1: '-393.5', step2: 'S(s) + O2(g) -> SO2(g)', dH2: '-296.8', step3: 'CS2(l) + 3O2(g) -> CO2(g) + 2SO2(g)', dH3: '-1076.9' },
  { id: 'H3-06', level: 3, target: 'CO(g) + 2H2(g) -> CH3OH(l)', step1: 'CH3OH(l) + 3/2O2(g) -> CO2(g) + 2H2O(l)', dH1: '-726.4', step2: 'CO(g) + 1/2O2(g) -> CO2(g)', dH2: '-283.0', step3: 'H2(g) + 1/2O2(g) -> H2O(l)', dH3: '-285.8' },
  // ---- Level 4: four steps ----
  { id: 'H4-01', level: 4, target: '2N2(g) + 5O2(g) -> 2N2O5(g)', step1: '2H2(g) + O2(g) -> 2H2O(l)', dH1: '-571.6', step2: 'N2O5(g) + H2O(l) -> 2HNO3(l)', dH2: '-73.7', step3: '1/2N2(g) + 3/2O2(g) + 1/2H2(g) -> HNO3(l)', dH3: '-174.1' },
  { id: 'H4-02', level: 4, target: 'N2H4(l) + O2(g) -> N2(g) + 2H2O(l)', step1: '2NH3(g) + 3N2O(g) -> 4N2(g) + 3H2O(l)', dH1: '-1010', step2: 'N2O(g) + 3H2(g) -> N2H4(l) + H2O(l)', dH2: '-317', step3: '2NH3(g) + 1/2O2(g) -> N2H4(l) + H2O(l)', dH3: '-143', step4: 'H2(g) + 1/2O2(g) -> H2O(l)', dH4: '-286' },
  { id: 'H4-03', level: 4, target: '2B(s) + 3H2(g) -> B2H6(g)', step1: '2B(s) + 3/2O2(g) -> B2O3(s)', dH1: '-1273', step2: 'B2H6(g) + 3O2(g) -> B2O3(s) + 3H2O(g)', dH2: '-2035', step3: 'H2(g) + 1/2O2(g) -> H2O(l)', dH3: '-286', step4: 'H2O(l) -> H2O(g)', dH4: '44' },
  // ---- Level 5: formation reactions ----
  { id: 'H5-01', level: 5, target: '4NH3(g) + 5O2(g) -> 4NO(g) + 6H2O(g)', step1: '1/2N2(g) + 3/2H2(g) -> NH3(g)', dH1: '-45.9', step2: '1/2N2(g) + 1/2O2(g) -> NO(g)', dH2: '91.3', step3: 'H2(g) + 1/2O2(g) -> H2O(g)', dH3: '-241.8',
    text: 'Each equation below is a formation reaction, so its ΔH is ΔH°f of the product. Use them to find ΔH°rxn for the target. (Slide 61)' },
  { id: 'H5-02', level: 5, target: 'C3H8(g) + 5O2(g) -> 3CO2(g) + 4H2O(l)', step1: '3C(s, graphite) + 4H2(g) -> C3H8(g)', dH1: '-103.8', step2: 'C(s, graphite) + O2(g) -> CO2(g)', dH2: '-393.5', step3: 'H2(g) + 1/2O2(g) -> H2O(l)', dH3: '-285.8',
    text: 'The equations below are formation reactions. Find ΔH°rxn for the combustion of propane.' },
  { id: 'H5-03', level: 5, target: 'C2H5OH(l) + 3O2(g) -> 2CO2(g) + 3H2O(l)', step1: '2C(s, graphite) + 3H2(g) + 1/2O2(g) -> C2H5OH(l)', dH1: '-277.6', step2: 'C(s, graphite) + O2(g) -> CO2(g)', dH2: '-393.5', step3: 'H2(g) + 1/2O2(g) -> H2O(l)', dH3: '-285.8',
    text: 'The equations below are formation reactions. Find ΔH°rxn for the combustion of ethanol.' },
  { id: 'H5-04', level: 5, target: 'Fe2O3(s) + 3CO(g) -> 2Fe(s) + 3CO2(g)', step1: '2Fe(s) + 3/2O2(g) -> Fe2O3(s)', dH1: '-824.2', step2: 'C(s, graphite) + 1/2O2(g) -> CO(g)', dH2: '-110.5', step3: 'C(s, graphite) + O2(g) -> CO2(g)', dH3: '-393.5',
    text: 'The equations below are formation reactions. Find ΔH°rxn for the reduction of iron(III) oxide by carbon monoxide.' },
  { id: 'H5-05', level: 5, target: '2H2S(g) + 3O2(g) -> 2H2O(l) + 2SO2(g)', step1: 'H2(g) + S(s) -> H2S(g)', dH1: '-20.6', step2: 'H2(g) + 1/2O2(g) -> H2O(l)', dH2: '-285.8', step3: 'S(s) + O2(g) -> SO2(g)', dH3: '-296.8',
    text: 'The equations below are formation reactions. Find ΔH°rxn for the target.' }
];
if (typeof module !== 'undefined') module.exports = HL_PROBLEMS;
