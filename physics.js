// ============================================================
// PHYSICS & THEORY ENGINE
// Live analytic formulas for the selected body. Every result carries
// its formula string and unit so the UI can teach, not just report.
//
// Sources / constants: IAU 2015 nominal values, NASA planetary fact
// sheets, JPL. Newtonian mechanics + one general-relativistic term
// (Einstein 1915 perihelion precession).
// ============================================================

(function () {
  // ─── Fundamental constants (SI) ───────────────────────────────
  const G     = 6.67430e-11;       // m^3 kg^-1 s^-2
  const C     = 299792458;         // m/s
  const AU    = 1.495978707e11;    // m
  const SIGMA = 5.670374419e-8;    // W m^-2 K^-4  (Stefan–Boltzmann)
  const M_SUN = 1.98892e30;        // kg
  const R_SUN = 6.957e8;           // m
  const L_SUN = 3.828e26;          // W   (IAU nominal solar luminosity)
  const T_SUN = 5772;              // K   (effective photospheric temp)
  const MU_SUN = G * M_SUN;        // standard gravitational parameter
  const YEAR_S = 365.25 * 86400;
  const DAY_S  = 86400;

  // ─── Per-body physical data (numeric SI; keyed by scene id) ─────
  // mass kg · equatorial radius m · Bond albedo · mean density kg/m^3
  const PHYS = {
    sun:     { mass: 1.98892e30, radius: 6.957e8,   albedo: null,  rho: 1408 },
    mercury: { mass: 3.3011e23,  radius: 2.4397e6,  albedo: 0.088, rho: 5427 },
    venus:   { mass: 4.8675e24,  radius: 6.0518e6,  albedo: 0.76,  rho: 5243 },
    earth:   { mass: 5.97237e24, radius: 6.3710e6,  albedo: 0.306, rho: 5514 },
    mars:    { mass: 6.4171e23,  radius: 3.3895e6,  albedo: 0.25,  rho: 3933 },
    jupiter: { mass: 1.8982e27,  radius: 6.9911e7,  albedo: 0.503, rho: 1326 },
    saturn:  { mass: 5.6834e26,  radius: 5.8232e7,  albedo: 0.342, rho: 687  },
    uranus:  { mass: 8.6810e25,  radius: 2.5362e7,  albedo: 0.300, rho: 1271 },
    neptune: { mass: 1.02413e26, radius: 2.4622e7,  albedo: 0.290, rho: 1638 },
    pluto:   { mass: 1.303e22,   radius: 1.1883e6,  albedo: 0.4,   rho: 1854 },
    ceres:   { mass: 9.3839e20,  radius: 4.696e5,   albedo: 0.09,  rho: 2162 },
    eris:    { mass: 1.6466e22,  radius: 1.163e6,   albedo: 0.96,  rho: 2520 },
    haumea:  { mass: 4.006e21,   radius: 7.8e5,     albedo: 0.66,  rho: 2600 },
    makemake:{ mass: 3.1e21,     radius: 7.15e5,    albedo: 0.81,  rho: 1700 },
  };

  // Representative satellite/ring-particle density for a Roche-limit demo (ice).
  const ICE_RHO = 917; // kg/m^3

  const fmtExp = (x, sig) => {
    sig = sig || 3;
    if (x === 0) return '0';
    const e = Math.floor(Math.log10(Math.abs(x)));
    if (e >= -2 && e < 5) return x.toLocaleString(undefined, { maximumSignificantDigits: sig + 1 });
    const m = x / Math.pow(10, e);
    return m.toFixed(sig) + '×10' + supExp(e);
  };
  const SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  function supExp(e) { return String(e).split('').map(ch => SUP[ch] || ch).join(''); }

  // ─── Main entry: structured, grouped, educational results ──────
  // ctx (optional): { rAU } live heliocentric distance for vis-viva/flux/force
  function bodyPhysics(id, ctx) {
    const p = PHYS[id];
    const data = (window.SOL_DATA || []).find(b => b.id === id) ||
                 (window.DWARF_PLANETS || []).find(b => b.id === id);
    if (!p || !data) return null;
    ctx = ctx || {};

    const OM = window.OrbitalMechanics;
    const el = OM && OM.ELEMENTS[id] ? OM.planetOrbitalElements(id, ctx.date || new Date()) : null;
    const aAU = el ? el.a : data.distanceAU;
    const e   = el ? el.e : 0;
    const a   = aAU * AU;                 // m
    const rAU = ctx.rAU != null ? ctx.rAU : aAU;
    const r   = rAU * AU;                 // m, live distance
    const isSun = id === 'sun';

    const cards = [];
    const add = (group, label, value, unit, formula, note) =>
      cards.push({ group, label, value, unit, formula, note });

    // ── SURFACE PHYSICS ────────────────────────────────────────
    const g = G * p.mass / (p.radius * p.radius);
    add('Surface physics', 'Surface gravity', g.toFixed(2), 'm/s²',
        'g = G·M / R²',
        (g / 9.807).toFixed(2) + '× Earth');

    const vEsc = Math.sqrt(2 * G * p.mass / p.radius) / 1000;
    add('Surface physics', 'Escape velocity', vEsc.toFixed(2), 'km/s',
        'v_esc = √(2GM / R)',
        'minimum speed to break free');

    if (!isSun) {
      // ── ENERGY BALANCE ───────────────────────────────────────
      const flux = L_SUN / (4 * Math.PI * r * r);
      add('Radiation & temperature', 'Solar flux (insolation)', flux.toFixed(1), 'W/m²',
          'S = L☉ / 4πd²',
          (flux / 1361).toFixed(3) + '× Earth (1361 W/m²)');

      const Teq = T_SUN * Math.sqrt(R_SUN / (2 * r)) * Math.pow(1 - (p.albedo || 0), 0.25);
      const TeqC = Teq - 273.15;
      const actualC = data.surfaceTempC;
      const greenhouse = actualC != null ? actualC - TeqC : null;
      add('Radiation & temperature', 'Equilibrium temperature', TeqC.toFixed(0), '°C',
          'T_eq = T☉·√(R☉/2d)·(1−A)^¼',
          greenhouse != null
            ? (greenhouse > 8
                ? '→ measured ' + actualC + ' °C: +' + greenhouse.toFixed(0) + ' °C greenhouse warming'
                : 'A (Bond albedo) = ' + p.albedo + '; close to measured ' + actualC + ' °C')
            : 'Bond albedo A = ' + p.albedo);

      // ── ORBITAL DYNAMICS ─────────────────────────────────────
      // Vis-viva at perihelion / aphelion / current
      const visviva = (rr) => Math.sqrt(MU_SUN * (2 / rr - 1 / a)) / 1000;
      const peri = a * (1 - e), apo = a * (1 + e);
      add('Orbital dynamics', 'Orbital speed (vis-viva)', visviva(r).toFixed(2), 'km/s',
          'v = √(μ(2/r − 1/a)),  μ = GM☉',
          'perihelion ' + visviva(peri).toFixed(1) + ' → aphelion ' + visviva(apo).toFixed(1) + ' km/s');

      // Kepler III — derived period vs actual
      const Tsec = 2 * Math.PI * Math.sqrt(a * a * a / MU_SUN);
      const Tyr = Tsec / YEAR_S;
      add('Orbital dynamics', "Period — Kepler's 3rd law", Tyr.toFixed(3), 'yr',
          'T = 2π·√(a³/μ)   ⇒   T² ∝ a³',
          'T²/a³ = ' + (Tyr * Tyr / (aAU * aAU * aAU)).toFixed(4) + ' yr²/AU³ (≈1 for all planets)');

      // Kepler II — areal velocity (constant)
      const dAdt = 0.5 * Math.sqrt(MU_SUN * a * (1 - e * e));  // m^2/s
      add('Orbital dynamics', "Areal velocity — Kepler's 2nd law", fmtExp(dAdt / (AU * AU) * YEAR_S, 2), 'AU²/yr',
          'dA/dt = ½·√(μ·a(1−e²)) = const',
          'equal areas swept in equal times');

      // Newtonian gravitational pull from the Sun (live)
      const F = G * M_SUN * p.mass / (r * r);
      add('Orbital dynamics', 'Gravitational pull from Sun', fmtExp(F, 2), 'N',
          'F = G·M☉·m / r²',
          'centripetal force holding the orbit');

      // ── HIERARCHY OF GRAVITY ─────────────────────────────────
      const hill = a * (1 - e) * Math.pow(p.mass / (3 * M_SUN), 1 / 3);  // m
      add('Spheres of influence', 'Hill sphere radius', fmtExp(hill / 1000, 3), 'km',
          'r_H ≈ a(1−e)·(m/3M☉)^⅓',
          fmtExp(hill / p.radius, 2) + '× planet radius — stable-moon zone');

      // Roche limit (rigid) for an icy body
      const roche = p.radius * Math.pow(2 * p.rho / ICE_RHO, 1 / 3);  // m
      add('Spheres of influence', 'Roche limit (icy moon)', fmtExp(roche / 1000, 3), 'km',
          'd = R·(2ρ/ρ_m)^⅓',
          (roche / p.radius).toFixed(2) + '× R — closer in, tides shred a moon');

      // Sun–planet barycentre offset
      const baryFromSun = a * p.mass / (M_SUN + p.mass);  // m
      add('Spheres of influence', 'Sun–planet barycentre', fmtExp(baryFromSun / 1000, 3), 'km',
          'r☉ = a·m/(M☉+m)',
          baryFromSun > R_SUN
            ? '↳ lies OUTSIDE the Sun (' + (baryFromSun / R_SUN).toFixed(2) + '× R☉)!'
            : (baryFromSun / R_SUN * 100).toFixed(2) + '% of the Sun\'s radius');

      // ── EVENTS ───────────────────────────────────────────────
      // Synodic period relative to Earth
      const Tearth = 1.0; // yr
      if (id !== 'earth') {
        const invSyn = Math.abs(1 / Tyr - 1 / Tearth);
        const Tsyn = 1 / invSyn; // yr
        add('Alignments & events', 'Synodic period (vs Earth)', (Tsyn * 365.25).toFixed(0), 'days',
            '1/T_syn = |1/T − 1/T⊕|',
            (Tsyn).toFixed(2) + ' yr between successive ' + (aAU < 1 ? 'inferior conjunctions' : 'oppositions'));
      }

      // ── RELATIVITY ───────────────────────────────────────────
      // GR perihelion precession (Einstein 1915), arcsec / century
      const advRadPerOrbit = 24 * Math.PI ** 3 * a * a / (Tsec * Tsec * C * C * (1 - e * e));
      const orbitsPerCentury = (100 * YEAR_S) / Tsec;
      const arcsecPerCentury = advRadPerOrbit * orbitsPerCentury * (180 / Math.PI) * 3600;
      add('General relativity', 'Perihelion precession (GR)', arcsecPerCentury.toFixed(2), '″/century',
          'Δφ = 24π³a² / [T²c²(1−e²)]',
          id === 'mercury'
            ? "Einstein's 43″/cy — the first confirmation of general relativity"
            : 'tiny but real; largest for Mercury (43″)');
    }

    return cards;
  }

  // Lightweight helpers reused by the scene layer
  function hillRadiusAU(id) {
    const p = PHYS[id]; if (!p) return 0;
    const OM = window.OrbitalMechanics;
    const el = OM && OM.ELEMENTS[id] ? OM.planetOrbitalElements(id, new Date()) : null;
    const aAU = el ? el.a : ((window.SOL_DATA || []).find(b => b.id === id) || {}).distanceAU || 1;
    const e = el ? el.e : 0;
    return aAU * (1 - e) * Math.pow(p.mass / (3 * M_SUN), 1 / 3);
  }
  function barycentreFromSunAU(id) {
    const p = PHYS[id]; if (!p) return 0;
    const OM = window.OrbitalMechanics;
    const el = OM && OM.ELEMENTS[id] ? OM.planetOrbitalElements(id, new Date()) : null;
    const aAU = el ? el.a : ((window.SOL_DATA || []).find(b => b.id === id) || {}).distanceAU || 1;
    return aAU * p.mass / (M_SUN + p.mass);
  }
  function massRatio(id) {
    const p = PHYS[id]; return p ? p.mass / M_SUN : 0;
  }

  window.Physics = {
    G, C, AU, SIGMA, M_SUN, R_SUN, L_SUN, T_SUN, MU_SUN,
    PHYS,
    bodyPhysics,
    hillRadiusAU,
    barycentreFromSunAU,
    massRatio,
  };
})();
