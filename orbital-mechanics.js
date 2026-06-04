// ============================================================
// ORBITAL MECHANICS — J2000 Keplerian element propagation
// Source: JPL "Approximate Positions of the Planets" (Standish 2006)
// https://ssd.jpl.nasa.gov/planets/approx_pos.html
//
// Elements at J2000.0 (JD 2451545.0 = 2000 Jan 1.5 TT):
//   a   semi-major axis (AU)
//   e   eccentricity
//   i   inclination to ecliptic (deg)
//   L   mean longitude (deg)
//   ωp  longitude of perihelion (deg)  = Ω + ω
//   Ω   longitude of ascending node (deg)
// Rates (per century): a_dot, e_dot, i_dot, L_dot, ωp_dot, Ω_dot
//
// We use only the secular linear rates — adequate for ±200 yr from J2000
// to better than ~1° visual accuracy. Pluto handled with non-orbiting
// extension terms in the JPL table.
// ============================================================

// J2000.0 in milliseconds (Unix epoch reference). UT, close enough.
const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0);

// Days since J2000 for a Date object
function julianDaysFromJ2000(date) {
  return (date.getTime() - J2000_MS) / 86400000;
}

// Centuries since J2000 (used for element propagation)
function centuriesSinceJ2000(date) {
  return julianDaysFromJ2000(date) / 36525;
}

const DEG = Math.PI / 180;

// ─── Element tables (JPL 1800–2050 set) ──────────────────────
// Each row: [a, e, i, L, ωp, Ω]
// Each rate: same units per century
const ELEMENTS = {
  mercury: {
    e0: [0.38709927, 0.20563593,  7.00497902, 252.25032350,  77.45779628,  48.33076593],
    er: [0.00000037, 0.00001906, -0.00594749, 149472.67411175, 0.16047689, -0.12534081],
  },
  venus: {
    e0: [0.72333566, 0.00677672,  3.39467605, 181.97909950, 131.60246718,  76.67984255],
    er: [0.00000390,-0.00004107, -0.00078890, 58517.81538729,  0.00268329, -0.27769418],
  },
  earth: {
    e0: [1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193,   0.0],
    er: [0.00000562,-0.00004392, -0.01294668, 35999.37244981,  0.32327364,   0.0],
  },
  mars: {
    e0: [1.52371034, 0.09339410,  1.84969142,  -4.55343205, -23.94362959,  49.55953891],
    er: [0.00001847, 0.00007882, -0.00813131, 19140.30268499,   0.44441088, -0.29257343],
  },
  jupiter: {
    e0: [5.20288700, 0.04838624,  1.30439695,  34.39644051,  14.72847983, 100.47390909],
    er: [-0.00011607,-0.00013253,-0.00183714,   3034.74612775,   0.21252668,   0.20469106],
  },
  saturn: {
    e0: [9.53667594, 0.05386179,  2.48599187,  49.95424423,  92.59887831, 113.66242448],
    er: [-0.00125060,-0.00050991, 0.00193609,   1222.49362201,  -0.41897216,  -0.28867794],
  },
  uranus: {
    e0: [19.18916464, 0.04725744,  0.77263783, 313.23810451, 170.95427630,  74.01692503],
    er: [-0.00196176,-0.00004397,-0.00242939,    428.48202785,   0.40805281,   0.04240589],
  },
  neptune: {
    e0: [30.06992276, 0.00859048,  1.77004347, -55.12002969,  44.96476227, 131.78422574],
    er: [0.00026291, 0.00005105, 0.00035372,    218.45945325,  -0.32241464,  -0.00508664],
  },
  pluto: {
    e0: [39.48211675, 0.24882730, 17.14001206, 238.92903833, 224.06891629, 110.30393684],
    er: [-0.00031596, 0.00005170, 0.00004818,    145.20780515,  -0.04062942,  -0.01183482],
  },

  // ─── Dwarf planets ───────────────────
  // From JPL Small-Body Database, mean elements (no secular rates here —
  // good enough for visual purposes inside ±100 yr of J2000).
  ceres:    { e0: [2.7691651, 0.0760091,  10.59407, 153.231, 73.597 + 80.30553, 80.30553], er: [0,0,0, 78192.0/36525*100, 0, 0] }, // L_dot from period 4.60 yr
  eris:     { e0: [67.86,     0.43607,    44.04,    204.16, 151.639 + 35.951, 35.951],    er: [0,0,0, 360/557.0*36525, 0, 0] },
  makemake: { e0: [45.79,     0.159,      29.0,     153.66,  297.0 + 79.36,    79.36],    er: [0,0,0, 360/310.0*36525, 0, 0] },
  haumea:   { e0: [43.13,     0.19126,    28.21,    202.67,  239.18 + 121.10, 121.10],    er: [0,0,0, 360/284.0*36525, 0, 0] },
};

// ─── Solve Kepler's equation M = E - e sin E for eccentric anomaly E ──
// Newton-Raphson; converges in ~3 iterations for e < 0.5, more for comets.
function solveKepler(M, e) {
  // Normalize M to [-π, π]
  M = M % (2 * Math.PI);
  if (M > Math.PI)  M -= 2 * Math.PI;
  if (M < -Math.PI) M += 2 * Math.PI;
  let E = M + e * Math.sin(M);   // initial guess
  const maxIter = e < 0.6 ? 8 : 30;
  for (let iter = 0; iter < maxIter; iter++) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-10) break;
  }
  return E;
}

// Convert Keplerian elements → heliocentric ecliptic (x, y, z) in AU.
// Inputs in radians except a (AU).
function keplerToHeliocentric(a, e, i, omegaBar, OmegaNode, M) {
  // Eccentric anomaly
  const E = solveKepler(M, e);
  // Position in orbital plane (perifocal x along periapsis)
  const xp = a * (Math.cos(E) - e);
  const yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
  // Argument of perihelion ω = ωp − Ω
  const omega = omegaBar - OmegaNode;
  // Rotate from perifocal → ecliptic
  const cosO = Math.cos(OmegaNode), sinO = Math.sin(OmegaNode);
  const cosW = Math.cos(omega),     sinW = Math.sin(omega);
  const cosI = Math.cos(i),         sinI = Math.sin(i);
  const x_ecl =
    (cosO * cosW - sinO * sinW * cosI) * xp +
    (-cosO * sinW - sinO * cosW * cosI) * yp;
  const y_ecl =
    (sinO * cosW + cosO * sinW * cosI) * xp +
    (-sinO * sinW + cosO * cosW * cosI) * yp;
  const z_ecl =
    (sinW * sinI) * xp +
    (cosW * sinI) * yp;
  return { x: x_ecl, y: y_ecl, z: z_ecl };
}

// Heliocentric position at a given Date for one planet.
// Returns { au_x, au_y, au_z } where au_y is OUT OF the ecliptic plane
// (to map onto Three.js Y-up convention).
function planetHeliocentricAU(bodyId, date) {
  const el = ELEMENTS[bodyId];
  if (!el) return null;
  const T = centuriesSinceJ2000(date);
  const a        = el.e0[0] + el.er[0] * T;
  const e        = el.e0[1] + el.er[1] * T;
  const iDeg     = el.e0[2] + el.er[2] * T;
  const LDeg     = el.e0[3] + el.er[3] * T;
  const wbarDeg  = el.e0[4] + el.er[4] * T;
  const ODeg     = el.e0[5] + el.er[5] * T;
  const i = iDeg * DEG;
  const L = LDeg * DEG;
  const omegaBar = wbarDeg * DEG;
  const OmegaNode = ODeg * DEG;
  const M = L - omegaBar;
  const p = keplerToHeliocentric(a, e, i, omegaBar, OmegaNode, M);
  // Three.js uses Y-up, ecliptic is X-Y; map ecliptic z → scene y, ecliptic y → scene z
  return { x: p.x, y: p.z, z: p.y, a, e, i: iDeg, M: ((M / DEG) % 360 + 360) % 360, omegaBar: wbarDeg, Omega: ODeg, L: LDeg };
}

// Get all current orbital elements (handy for Keplerian-elements panel)
function planetOrbitalElements(bodyId, date) {
  const el = ELEMENTS[bodyId];
  if (!el) return null;
  const T = centuriesSinceJ2000(date);
  return {
    a:    el.e0[0] + el.er[0] * T,
    e:    el.e0[1] + el.er[1] * T,
    i:    el.e0[2] + el.er[2] * T,
    L:    el.e0[3] + el.er[3] * T,
    wbar: el.e0[4] + el.er[4] * T,
    Omega:el.e0[5] + el.er[5] * T,
  };
}

// Sample N points along the orbit (in heliocentric AU) for drawing the
// ellipse — uses elements at the given epoch, samples eccentric anomaly.
function sampleOrbit(bodyId, date, samples) {
  const el = ELEMENTS[bodyId];
  if (!el) return [];
  samples = samples || 256;
  const T = centuriesSinceJ2000(date);
  const a        = el.e0[0] + el.er[0] * T;
  const e        = el.e0[1] + el.er[1] * T;
  const i        = (el.e0[2] + el.er[2] * T) * DEG;
  const wbar     = (el.e0[4] + el.er[4] * T) * DEG;
  const Onode    = (el.e0[5] + el.er[5] * T) * DEG;
  const out = [];
  for (let k = 0; k < samples; k++) {
    const Eang = (k / (samples - 1)) * 2 * Math.PI;
    const xp = a * (Math.cos(Eang) - e);
    const yp = a * Math.sqrt(1 - e * e) * Math.sin(Eang);
    const omega = wbar - Onode;
    const cosO = Math.cos(Onode), sinO = Math.sin(Onode);
    const cosW = Math.cos(omega), sinW = Math.sin(omega);
    const cosI = Math.cos(i),     sinI = Math.sin(i);
    const x_ecl =
      (cosO * cosW - sinO * sinW * cosI) * xp +
      (-cosO * sinW - sinO * cosW * cosI) * yp;
    const y_ecl =
      (sinO * cosW + cosO * sinW * cosI) * xp +
      (-sinO * sinW + cosO * cosW * cosI) * yp;
    const z_ecl =
      (sinW * sinI) * xp +
      (cosW * sinI) * yp;
    // ecliptic → scene Y-up
    out.push({ x: x_ecl, y: z_ecl, z: y_ecl });
  }
  return out;
}

// ─── COMET PROPAGATION (custom elements, optionally retrograde) ───────
// Comets: pass element block { a, e, i, omegaBar, OmegaNode, periheliodDate }
// We compute mean motion from a (n = 2π / T, T = a^1.5 yr) and propagate
// mean anomaly M = n·(date − periheliondate) from the given perihelion epoch.
function cometHeliocentricAU(elements, date) {
  const a = elements.a;
  const e = elements.e;
  const i = (elements.i || 0) * DEG;
  const omegaBar  = (elements.omegaBar  || 0) * DEG;
  const OmegaNode = (elements.OmegaNode || 0) * DEG;
  // Period in years from Kepler: T = a^1.5 (in years for solar mass)
  const T_years = Math.pow(Math.abs(a), 1.5);
  const T_days = T_years * 365.25;
  const days = (date.getTime() - new Date(elements.periheliondate).getTime()) / 86400000;
  const n = 2 * Math.PI / T_days;
  const sign = elements.retrograde ? -1 : 1;
  const M = sign * n * days;
  const p = keplerToHeliocentric(a, e, i, omegaBar, OmegaNode, M);
  return { x: p.x, y: p.z, z: p.y, a, e };
}

// Sample a comet's orbit for drawing — caps at 2π eccentric anomaly which
// for e > 0.9 still gives a usable elongated ellipse.
function sampleCometOrbit(elements, samples) {
  samples = samples || 360;
  const a = elements.a;
  const e = elements.e;
  const i = (elements.i || 0) * DEG;
  const omegaBar  = (elements.omegaBar  || 0) * DEG;
  const OmegaNode = (elements.OmegaNode || 0) * DEG;
  const omega = omegaBar - OmegaNode;
  const out = [];
  // Cap eccentric anomaly span so very long ellipses don't disappear into AU=infinity
  for (let k = 0; k < samples; k++) {
    const E = (k / (samples - 1)) * 2 * Math.PI;
    const xp = a * (Math.cos(E) - e);
    const yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
    const cosO = Math.cos(OmegaNode), sinO = Math.sin(OmegaNode);
    const cosW = Math.cos(omega),     sinW = Math.sin(omega);
    const cosI = Math.cos(i),         sinI = Math.sin(i);
    const x_ecl =
      (cosO * cosW - sinO * sinW * cosI) * xp +
      (-cosO * sinW - sinO * cosW * cosI) * yp;
    const y_ecl =
      (sinO * cosW + cosO * sinW * cosI) * xp +
      (-sinO * sinW + cosO * cosW * cosI) * yp;
    const z_ecl =
      (sinW * sinI) * xp +
      (cosW * sinI) * yp;
    out.push({ x: x_ecl, y: z_ecl, z: y_ecl });
  }
  return out;
}

// Convert heliocentric AU vector → scene-unit vector while preserving the
// ellipse shape. We scale by sceneR/r so radial distance gets the project's
// mode-aware compression but direction (and hence orbit shape) is preserved.
function auToSceneVec(au_x, au_y, au_z, mode) {
  const r = Math.hypot(au_x, au_y, au_z);
  if (r < 1e-9) return { x: 0, y: 0, z: 0 };
  const sceneR = window.scaleDistance3D(r, mode);
  const k = sceneR / r;
  return { x: au_x * k, y: au_y * k, z: au_z * k };
}

// Export
window.OrbitalMechanics = {
  J2000_MS,
  julianDaysFromJ2000,
  centuriesSinceJ2000,
  ELEMENTS,
  solveKepler,
  keplerToHeliocentric,
  planetHeliocentricAU,
  planetOrbitalElements,
  sampleOrbit,
  cometHeliocentricAU,
  sampleCometOrbit,
  auToSceneVec,
};
