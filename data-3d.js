// ============================================================
// 3D SOLAR SYSTEM — PLANETARY DATA + PROCEDURAL TEXTURES
// All real-world physical values; textures generated on the fly.
// ============================================================

const SOL_DATA = [
  {
    id: 'sun', name: 'Sun', type: 'star',
    diameterKm: 1392700, distanceAU: 0,
    averageDistanceFromSunKm: 0, orbitalPeriodDays: 0,
    rotationPeriodHours: 609.12, axialTiltDeg: 7.25,
    moons: 0, hasRings: false,
    color: '#FFD96B', emissive: '#FF8C00',
    surfaceTempC: 5500, mass: '1.989×10³⁰ kg',
    gravityMS2: 274.0, densityGcc: 1.41, escapeVelKmS: 617.5,
    atmospherePressure: 'N/A (plasma)',
    discoveredBy: 'Known since prehistory', discoveredYear: null,
    composition: 'Hydrogen (74%), Helium (24%)',
    notableMoons: [],
    shortDescription: 'A G-type main-sequence star — a colossal sphere of plasma fusing 600 million tons of hydrogen into helium every second.',
    facts: [
      'Light takes 8 min 20 s to reach Earth from the Sun.',
      'The core reaches 15 million °C and 250 billion atm of pressure.',
      'Sound waves take 14 years to traverse the Sun, were the medium continuous.',
      'The Sun loses 4.7 million tons of mass per second as radiation.',
      'It is currently halfway through its 10-billion-year main-sequence life.'
    ]
  },
  {
    id: 'mercury', name: 'Mercury', type: 'planet',
    diameterKm: 4879, distanceAU: 0.387,
    averageDistanceFromSunKm: 57909000, orbitalPeriodDays: 87.97,
    rotationPeriodHours: 1407.6, axialTiltDeg: 0.034,
    moons: 0, hasRings: false,
    color: '#A89888', emissive: '#000000',
    surfaceTempC: 167, mass: '3.301×10²³ kg',
    gravityMS2: 3.7, densityGcc: 5.43, escapeVelKmS: 4.25,
    atmospherePressure: '~10⁻¹⁵ bar (exosphere)',
    discoveredBy: 'Known since prehistory', discoveredYear: null,
    composition: 'Iron core (85% of radius), silicate mantle',
    notableMoons: [],
    shortDescription: 'A cratered, airless rock — the smallest and innermost planet, with the most extreme day-night temperature swing in the Solar System.',
    facts: [
      'Surface temperatures range from −180 °C to 430 °C.',
      'A solar day on Mercury lasts 176 Earth days.',
      'Mercury is smaller than Jupiter\'s moon Ganymede.',
      'Its 3:2 spin-orbit resonance means three rotations per two orbits.',
      'NASA\'s MESSENGER mapped its entire surface in 2008–2015.'
    ]
  },
  {
    id: 'venus', name: 'Venus', type: 'planet',
    diameterKm: 12104, distanceAU: 0.723,
    averageDistanceFromSunKm: 108200000, orbitalPeriodDays: 224.7,
    rotationPeriodHours: -5832.5, axialTiltDeg: 177.4,
    moons: 0, hasRings: false,
    color: '#E8B770', emissive: '#000000',
    surfaceTempC: 464, mass: '4.867×10²⁴ kg',
    gravityMS2: 8.87, densityGcc: 5.24, escapeVelKmS: 10.36,
    atmospherePressure: '92 bar (≈900 m underwater on Earth)',
    discoveredBy: 'Known since prehistory', discoveredYear: null,
    composition: '96.5% CO₂ atmosphere, basalt crust',
    notableMoons: [],
    shortDescription: 'A runaway-greenhouse hellscape — Earth\'s near-twin in mass, ruined by a thick CO₂ atmosphere that traps heat at 92× Earth\'s pressure.',
    facts: [
      'Surface temperature exceeds Mercury\'s despite being further from the Sun.',
      'Venus rotates backwards — the Sun rises in the west.',
      'A day on Venus (243 Earth days) is longer than its year (225 days).',
      'Surface pressure equivalent to being 900 m underwater on Earth.',
      'Sulphuric-acid clouds whip around the planet in just 4 days.'
    ]
  },
  {
    id: 'earth', name: 'Earth', type: 'planet',
    diameterKm: 12742, distanceAU: 1.000,
    averageDistanceFromSunKm: 149600000, orbitalPeriodDays: 365.25,
    rotationPeriodHours: 23.934, axialTiltDeg: 23.44,
    moons: 1, hasRings: false,
    color: '#2D7AB5', emissive: '#000000',
    surfaceTempC: 15, mass: '5.972×10²⁴ kg',
    gravityMS2: 9.807, densityGcc: 5.51, escapeVelKmS: 11.19,
    atmospherePressure: '1.013 bar (1 atm)',
    discoveredBy: '—', discoveredYear: null,
    composition: '78% N₂ / 21% O₂ atmosphere, silicate crust, iron core',
    notableMoons: [
      { id: 'luna', name: 'Moon', diameterKm: 3474, distFromParentKm: 384400, orbitalPeriodDays: 27.32, eccentricity: 0.0549, inclinationDeg: 5.145, color: '#C8C5BD', desc: 'The fifth-largest moon in the Solar System; stabilises Earth\'s axial tilt and drives the tides.' },
    ],
    shortDescription: 'The only world known to host life: liquid water oceans, a magnetic shield against solar wind, and a single large moon that stabilises its axial tilt.',
    facts: [
      '71% of the surface is liquid water.',
      'The magnetic field deflects ~99% of the solar wind.',
      'Earth gains ~40,000 tons of cosmic dust per year.',
      'The Moon is moving away at 3.8 cm per year — eventually disabling total solar eclipses.',
      'Earth\'s rotation is slowing by ~1.7 ms per century due to tidal friction.'
    ]
  },
  {
    id: 'mars', name: 'Mars', type: 'planet',
    diameterKm: 6779, distanceAU: 1.524,
    averageDistanceFromSunKm: 227900000, orbitalPeriodDays: 686.97,
    rotationPeriodHours: 24.623, axialTiltDeg: 25.19,
    moons: 2, hasRings: false,
    color: '#C2532E', emissive: '#000000',
    surfaceTempC: -65, mass: '6.417×10²³ kg',
    gravityMS2: 3.72, densityGcc: 3.93, escapeVelKmS: 5.03,
    atmospherePressure: '0.006 bar (1/170 of Earth)',
    discoveredBy: 'Known since prehistory', discoveredYear: null,
    composition: '95% CO₂ thin atmosphere, iron-oxide-rich basalt',
    notableMoons: [
      { id: 'phobos', name: 'Phobos', diameterKm: 22.4, distFromParentKm: 9376, orbitalPeriodDays: 0.319, eccentricity: 0.0151, inclinationDeg: 1.093, color: '#8B7B6B', desc: 'A potato-shaped asteroid-like moon spiralling inward by 1.8 cm/year — will crash into Mars in ~50 Myr.' },
      { id: 'deimos', name: 'Deimos', diameterKm: 12.4, distFromParentKm: 23463, orbitalPeriodDays: 1.263, eccentricity: 0.00033, inclinationDeg: 0.93, color: '#9B8B7B', desc: 'Smallest moon in the Solar System; barely outpaces synchronous orbit, drifting slowly outward.' },
    ],
    shortDescription: 'The Red Planet — home to the Solar System\'s tallest mountain, longest canyon, and a thin atmosphere over a frozen, rusted desert.',
    facts: [
      'Olympus Mons rises 21.9 km — nearly 2.5× the height of Everest.',
      'Valles Marineris is 4,000 km long and 7 km deep.',
      'A Martian sol lasts 24h 39m 35s — strikingly similar to Earth.',
      'Polar ice caps are a mix of water ice and frozen CO₂.',
      'Evidence of ancient riverbeds and lakebeds suggests liquid water in the past.'
    ]
  },
  {
    id: 'jupiter', name: 'Jupiter', type: 'planet',
    diameterKm: 139820, distanceAU: 5.203,
    averageDistanceFromSunKm: 778500000, orbitalPeriodDays: 4333,
    rotationPeriodHours: 9.925, axialTiltDeg: 3.13,
    moons: 95, hasRings: true,
    color: '#C99A6B', emissive: '#000000',
    surfaceTempC: -110, mass: '1.898×10²⁷ kg',
    gravityMS2: 24.79, densityGcc: 1.33, escapeVelKmS: 59.5,
    atmospherePressure: 'No solid surface — pressure increases without limit',
    discoveredBy: 'Known since prehistory', discoveredYear: null,
    composition: '90% Hydrogen, 10% Helium, metallic hydrogen core',
    notableMoons: [
      { id: 'io', name: 'Io', diameterKm: 3643, distFromParentKm: 421700, orbitalPeriodDays: 1.769, eccentricity: 0.0041, inclinationDeg: 0.04, color: '#F5C84A', desc: 'Most volcanically active body in the Solar System — over 400 active volcanoes powered by tidal flexing.' },
      { id: 'europa', name: 'Europa', diameterKm: 3122, distFromParentKm: 671100, orbitalPeriodDays: 3.551, eccentricity: 0.0094, inclinationDeg: 0.47, color: '#DDC9A8', desc: 'Smooth icy crust hiding a 100-km-deep saltwater ocean — a prime target for astrobiology.' },
      { id: 'ganymede', name: 'Ganymede', diameterKm: 5268, distFromParentKm: 1070400, orbitalPeriodDays: 7.155, eccentricity: 0.0011, inclinationDeg: 0.21, color: '#9B8C76', desc: 'Largest moon in the Solar System — bigger than Mercury; the only moon with its own magnetic field.' },
      { id: 'callisto', name: 'Callisto', diameterKm: 4821, distFromParentKm: 1882700, orbitalPeriodDays: 16.689, eccentricity: 0.0074, inclinationDeg: 0.51, color: '#6B6660', desc: 'Most heavily cratered body in the Solar System; geologically dead since formation.' },
    ],
    shortDescription: 'A failed star and king of planets — more massive than all other planets combined, host to a 350-year-old storm larger than Earth.',
    facts: [
      'Jupiter\'s mass is 2.5× the rest of the planets combined.',
      'The Great Red Spot has shrunk from 41,000 km to 16,000 km across since 1879.',
      'It has 95 known moons; four are larger than Pluto.',
      'Spins fastest of all planets — one day in 9h 56m.',
      'Its magnetosphere extends past Saturn\'s orbit at times.'
    ]
  },
  {
    id: 'saturn', name: 'Saturn', type: 'planet',
    diameterKm: 116460, distanceAU: 9.537,
    averageDistanceFromSunKm: 1432000000, orbitalPeriodDays: 10759,
    rotationPeriodHours: 10.656, axialTiltDeg: 26.73,
    moons: 146, hasRings: true,
    color: '#E4C97A', emissive: '#000000',
    surfaceTempC: -140, mass: '5.683×10²⁶ kg',
    gravityMS2: 10.44, densityGcc: 0.687, escapeVelKmS: 35.5,
    atmospherePressure: 'No solid surface — gradient gas/liquid',
    discoveredBy: 'Known since prehistory; rings — Galileo 1610', discoveredYear: null,
    composition: '96% Hydrogen, 3% Helium, rocky core',
    notableMoons: [
      { id: 'titan', name: 'Titan', diameterKm: 5150, distFromParentKm: 1221870, orbitalPeriodDays: 15.945, eccentricity: 0.0288, inclinationDeg: 0.33, color: '#D9A646', desc: 'Only moon with a thick atmosphere (1.5 bar N₂/CH₄) and stable surface liquids — methane lakes and rivers.' },
      { id: 'enceladus', name: 'Enceladus', diameterKm: 504, distFromParentKm: 237948, orbitalPeriodDays: 1.370, eccentricity: 0.0047, inclinationDeg: 0.019, color: '#F4F1ED', desc: 'Ice-shell world venting water vapour from a subsurface ocean — molecular hydrogen suggests hydrothermal vents.' },
      { id: 'rhea', name: 'Rhea', diameterKm: 1527, distFromParentKm: 527108, orbitalPeriodDays: 4.518, eccentricity: 0.0013, inclinationDeg: 0.345, color: '#C6BFB3', desc: 'Saturn\'s second-largest moon — heavily cratered ice with a tenuous oxygen-CO₂ exosphere.' },
      { id: 'iapetus', name: 'Iapetus', diameterKm: 1469, distFromParentKm: 3560820, orbitalPeriodDays: 79.32, eccentricity: 0.0286, inclinationDeg: 15.47, color: '#988064', desc: 'Two-toned world: one hemisphere bright ice, the other dark organic dust — and a 13-km-tall equatorial ridge.' },
      { id: 'mimas', name: 'Mimas', diameterKm: 396, distFromParentKm: 185539, orbitalPeriodDays: 0.942, eccentricity: 0.0202, inclinationDeg: 1.574, color: '#C7C1B7', desc: 'The "Death Star" moon — dominated by the 130-km Herschel crater, almost a third of its diameter.' },
    ],
    shortDescription: 'The jewel of the Solar System — a gas giant girdled by 282,000 km of ice and rock rings, only 10–100 m thick.',
    facts: [
      'Average density is lower than water — Saturn would float.',
      'The rings are 90% water ice and span Saturn–Moon distance.',
      'Titan has a thicker atmosphere than Earth, with methane lakes.',
      'Enceladus jets water plumes from a subsurface ocean.',
      'Winds at Saturn\'s equator reach 1,800 km/h.'
    ]
  },
  {
    id: 'uranus', name: 'Uranus', type: 'planet',
    diameterKm: 50724, distanceAU: 19.191,
    averageDistanceFromSunKm: 2871000000, orbitalPeriodDays: 30589,
    rotationPeriodHours: -17.24, axialTiltDeg: 97.77,
    moons: 28, hasRings: true,
    color: '#7DE8E8', emissive: '#000000',
    surfaceTempC: -195, mass: '8.681×10²⁵ kg',
    gravityMS2: 8.69, densityGcc: 1.27, escapeVelKmS: 21.3,
    atmospherePressure: 'No solid surface — ice/gas mix',
    discoveredBy: 'William Herschel', discoveredYear: 1781,
    composition: 'Hydrogen, Helium, methane (gives blue colour)',
    notableMoons: [
      { id: 'titania', name: 'Titania', diameterKm: 1577, distFromParentKm: 435910, orbitalPeriodDays: 8.706, eccentricity: 0.0011, inclinationDeg: 0.34, color: '#A8978A', desc: 'Largest Uranian moon — fractured ice surface with canyons up to 1,500 km long.' },
      { id: 'oberon', name: 'Oberon', diameterKm: 1523, distFromParentKm: 583520, orbitalPeriodDays: 13.46, eccentricity: 0.0014, inclinationDeg: 0.07, color: '#8E7C70', desc: 'Outermost large moon; dark cratered terrain with mysterious dark deposits on crater floors.' },
      { id: 'miranda', name: 'Miranda', diameterKm: 471, distFromParentKm: 129390, orbitalPeriodDays: 1.413, eccentricity: 0.0013, inclinationDeg: 4.34, color: '#9C9890', desc: 'Solar System\'s most extreme topography for its size — 20-km cliffs and a Frankenstein\'d surface.' },
      { id: 'ariel', name: 'Ariel', diameterKm: 1158, distFromParentKm: 191020, orbitalPeriodDays: 2.520, eccentricity: 0.0012, inclinationDeg: 0, color: '#BAB1A5', desc: 'Brightest Uranian moon; complex valley networks suggest past cryovolcanism.' },
      { id: 'umbriel', name: 'Umbriel', diameterKm: 1169, distFromParentKm: 266000, orbitalPeriodDays: 4.144, eccentricity: 0.0039, inclinationDeg: 0.205, color: '#65605A', desc: 'Darkest Uranian moon; nearly featureless except for the bright Wunda crater.' },
    ],
    shortDescription: 'An ice giant knocked on its side — Uranus rotates at 98° to the ecliptic, likely the scar of an ancient catastrophic collision.',
    facts: [
      'Axial tilt of 97.77° means each pole sees 42 years of sunlight, then 42 of darkness.',
      'Coldest planetary atmosphere in the Solar System: −224 °C.',
      'Has 13 rings, discovered in 1977 by stellar occultation.',
      '28 moons, all named after Shakespeare and Pope characters.',
      'Only visited once: Voyager 2 flyby in 1986.'
    ]
  },
  {
    id: 'neptune', name: 'Neptune', type: 'planet',
    diameterKm: 49244, distanceAU: 30.07,
    averageDistanceFromSunKm: 4495000000, orbitalPeriodDays: 59800,
    rotationPeriodHours: 16.11, axialTiltDeg: 28.32,
    moons: 16, hasRings: true,
    color: '#3B5BD6', emissive: '#000000',
    surfaceTempC: -200, mass: '1.024×10²⁶ kg',
    gravityMS2: 11.15, densityGcc: 1.64, escapeVelKmS: 23.5,
    atmospherePressure: 'No solid surface — gas/ice transition',
    discoveredBy: 'Le Verrier, Adams & Galle (mathematical prediction)', discoveredYear: 1846,
    composition: 'Hydrogen, Helium, ices (water/ammonia/methane)',
    notableMoons: [
      { id: 'triton', name: 'Triton', diameterKm: 2707, distFromParentKm: 354759, orbitalPeriodDays: -5.877, eccentricity: 0.000016, inclinationDeg: 156.865, color: '#BFB8A8', desc: 'Largest Neptunian moon — orbits backwards, a captured Kuiper Belt object; nitrogen geysers and frozen lakes.' },
      { id: 'nereid', name: 'Nereid', diameterKm: 340, distFromParentKm: 5513400, orbitalPeriodDays: 360.13, eccentricity: 0.7507, inclinationDeg: 7.232, color: '#A89E90', desc: 'Most eccentric orbit of any known moon — distance varies by a factor of seven over each year.' },
      { id: 'proteus', name: 'Proteus', diameterKm: 420, distFromParentKm: 117647, orbitalPeriodDays: 1.122, eccentricity: 0.0005, inclinationDeg: 0.524, color: '#605C56', desc: 'Second-largest Neptunian moon and one of the darkest objects in the outer Solar System.' },
    ],
    shortDescription: 'The wind world — fastest atmospheric winds in the Solar System (2,100 km/h) on a planet so far that sunlight is 1/900th that of Earth.',
    facts: [
      'Winds reach 2,100 km/h — supersonic at Neptune\'s temperature.',
      'Predicted mathematically before being observed in 1846.',
      'A Neptune year lasts 165 Earth years — completed one orbit since discovery in 2011.',
      'Triton, its largest moon, orbits retrograde and is geologically active.',
      'Internal heat radiates 2.6× more than it receives from the Sun.'
    ]
  },
  {
    id: 'pluto', name: 'Pluto', type: 'dwarf_planet',
    diameterKm: 2377, distanceAU: 39.48,
    averageDistanceFromSunKm: 5906000000, orbitalPeriodDays: 90560,
    rotationPeriodHours: -153.3, axialTiltDeg: 122.53,
    moons: 5, hasRings: false,
    color: '#D4A882', emissive: '#000000',
    surfaceTempC: -229, mass: '1.303×10²² kg',
    gravityMS2: 0.62, densityGcc: 1.86, escapeVelKmS: 1.21,
    atmospherePressure: '~10⁻⁵ bar (collapses when far from Sun)',
    discoveredBy: 'Clyde Tombaugh', discoveredYear: 1930,
    composition: 'Nitrogen/methane ices, rocky core',
    notableMoons: [
      { id: 'charon', name: 'Charon', diameterKm: 1212, distFromParentKm: 19571, orbitalPeriodDays: 6.387, eccentricity: 0, inclinationDeg: 0, color: '#A89C90', desc: 'Half Pluto\'s diameter — they orbit a common barycentre OUTSIDE Pluto, making this a true binary system.' },
      { id: 'hydra', name: 'Hydra', diameterKm: 51, distFromParentKm: 64738, orbitalPeriodDays: 38.20, eccentricity: 0.0059, inclinationDeg: 0.242, color: '#D6CFC2', desc: 'Outermost moon; chaotic rotation due to its irregular shape and the Pluto-Charon binary tides.' },
    ],
    shortDescription: 'A dwarf planet at the edge of the Kuiper Belt — featuring a nitrogen-ice heart, towering water-ice mountains, and a thin escaping atmosphere.',
    facts: [
      'Demoted from planet to dwarf planet by the IAU on 24 August 2006.',
      'Sputnik Planitia — a 1,000-km-wide nitrogen ice plain shaped like a heart.',
      'Charon is half Pluto\'s diameter — essentially a binary system.',
      'Pluto\'s orbit is so elliptical it briefly comes inside Neptune\'s.',
      'New Horizons flew past at 14 km/s on 14 July 2015 — the only mission.'
    ]
  },
];

// ============================================================
// SCALE FUNCTIONS (3D space units)
// ============================================================
const SCALE_3D = {
  HYBRID: 'hybrid',
  REAL_DISTANCE: 'real_distance',
  REAL_SIZE: 'real_size',
  TRUE_SCALE: 'true_scale',   // 1:1 — both size AND distance at real ratio
};

// True-scale: 1 scene unit = 1 Sun-diameter (1,392,700 km).
// At this scale 1 AU = 107.46 units, Neptune ≈ 3231 units, Pluto ≈ 4243 units.
// Sun radius = 0.5 units, Earth radius ≈ 0.00457 units (sub-pixel from any wide view).
const TRUE_AU_TO_UNITS = (149597870.7 / 1392700); // ≈ 107.4
const TRUE_KM_TO_UNITS = (1 / 1392700);            // radius in units = km / 1392700

// Scene units: ~200 units = full system view comfortably
function scaleDistance3D(au, mode) {
  if (au <= 0) return 0;
  if (mode === SCALE_3D.TRUE_SCALE) {
    return au * TRUE_AU_TO_UNITS;
  }
  if (mode === SCALE_3D.REAL_DISTANCE) {
    // Linear: 1 AU = 7 units (Neptune at 210, Pluto at 276)
    return au * 7;
  }
  // HYBRID / REAL_SIZE: logarithmic
  const maxAU = 45;
  return (Math.log(1 + au) / Math.log(1 + maxAU)) * 180;
}

function scaleDiameter3D(km, type, mode, magnifyFactor) {
  const mag = magnifyFactor || 1;
  if (mode === SCALE_3D.TRUE_SCALE) {
    // True 1:1: no minimum clamp, no magnification — every body at true ratio.
    // Sub-pixel bodies are handled by locator sprites in the scene engine.
    return km * TRUE_KM_TO_UNITS;
  }
  if (mode === SCALE_3D.REAL_SIZE) {
    // True relative diameters; Sun = 8 units
    const sunRefRadius = 8;
    const scale = sunRefRadius / (1392700 / 2);
    const r = (km / 2) * scale;
    if (type === 'star') return r;
    // Apply magnification so planets are still findable
    return Math.max(r * mag, 0.04);
  }
  // HYBRID: Sun smaller, planets enlarged
  if (type === 'star') return 4.5;
  // Planets scaled relative to Jupiter (largest = 1.4 base × magnifier)
  const jupiterKm = 139820;
  const jupiterRadius = 1.4;
  const r = (km / jupiterKm) * jupiterRadius;
  return Math.max(r * mag, 0.06);
}

// ─── MOON SCALING ─────────────────────────────────────────
// Moons sit between their planet's radius and a few planet-radii out. For
// visual modes we compress aggressively so satellites stay visible alongside
// their host; TRUE_SCALE uses real km.
function scaleMoonDiameter3D(moonKm, parentDiameterKm, parentRadiusUnits, mode, magnify) {
  const mag = magnify || 1;
  if (mode === SCALE_3D.TRUE_SCALE) {
    return moonKm * TRUE_KM_TO_UNITS;
  }
  if (mode === SCALE_3D.REAL_SIZE) {
    const sunRefRadius = 8;
    const scale = sunRefRadius / (1392700 / 2);
    return Math.max((moonKm / 2) * scale * mag, 0.02);
  }
  // HYBRID / REAL_DISTANCE: relative to parent, with a small floor
  const ratio = moonKm / parentDiameterKm;
  return Math.max(parentRadiusUnits * ratio, parentRadiusUnits * 0.05);
}

function scaleMoonDistance3D(distFromParentKm, parentDiameterKm, parentRadiusUnits, mode) {
  if (mode === SCALE_3D.TRUE_SCALE) {
    return distFromParentKm * TRUE_KM_TO_UNITS;
  }
  const realRatio = distFromParentKm / (parentDiameterKm / 2);   // distance in parent-radii
  if (mode === SCALE_3D.REAL_SIZE) {
    // Real-ratio (capped so faraway moons like Iapetus or Nereid don't fly off-screen)
    return Math.min(realRatio, 40) * parentRadiusUnits;
  }
  if (mode === SCALE_3D.REAL_DISTANCE) {
    return Math.min(realRatio, 30) * parentRadiusUnits;
  }
  // HYBRID: log-compressed so close-in and far-out moons stay distinguishable
  return parentRadiusUnits * (1.8 + 0.65 * Math.log10(Math.max(realRatio, 1)));
}

// ─── ASTEROID / KUIPER OBJECT SIZE ─────────────────────────────
// Real asteroids are 1–200 km, Kuiper objects mostly 10–500 km. In REAL_SIZE
// and TRUE_SCALE we honour real km; in the visual modes (HYBRID, REAL_DISTANCE)
// we use a power-law VISUAL scale so rocks stay clearly visible — they're
// already smaller than every planet in those modes thanks to the planets'
// magnification.
function scaleSmallBodyDiameter3D(km, mode, magnify) {
  const mag = magnify || 1;
  if (mode === SCALE_3D.TRUE_SCALE) {
    return km * TRUE_KM_TO_UNITS;
  }
  if (mode === SCALE_3D.REAL_SIZE) {
    const sunRefRadius = 8;
    const scale = sunRefRadius / (1392700 / 2);
    return Math.max((km / 2) * scale * mag, 0.003);
  }
  // HYBRID / REAL_DISTANCE: visual scale. Map km → visible chunk.
  // 1 km → 0.045 units, 200 km → 0.35 units. Roughly preserves "big rocks
  // look bigger" while staying clearly under planet radii.
  const t = Math.min(1, km / 200);
  return 0.045 + t * 0.30;
}

// ============================================================
// PROCEDURAL TEXTURE GENERATORS
// All return HTMLCanvasElement for use as Three.CanvasTexture
// Equirectangular projection (2:1 aspect)
// ============================================================
function noise(x, y, scale, seed) {
  // Simple value noise via hash
  const s = seed || 1;
  const n = Math.sin((x * 12.9898 + y * 78.233 + s * 37.719) * scale) * 43758.5453;
  return n - Math.floor(n);
}

function fbm(x, y, octaves, seed) {
  let val = 0, amp = 1, freq = 1, max = 0;
  for (let i = 0; i < octaves; i++) {
    val += noise(x * freq, y * freq, 1, seed + i) * amp;
    max += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return val / max;
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function generateTexture(bodyId, size) {
  size = size || 512;
  const c = makeCanvas(size, size / 2);
  const ctx = c.getContext('2d');
  const w = c.width, h = c.height;
  const img = ctx.createImageData(w, h);
  const data = img.data;

  function setPx(x, y, r, g, b) {
    const i = (y * w + x) * 4;
    data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255;
  }

  if (bodyId === 'sun') {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        // Granulation cells + larger convection patterns
        const cells = fbm(x * 0.025, y * 0.025, 4, 13);
        const granul = fbm(x * 0.18, y * 0.18, 4, 19);
        const v = cells * 0.65 + granul * 0.35;
        // White-hot peaks, deep orange troughs (real photosphere look)
        const r = 255;
        const g = Math.floor(170 + Math.pow(v, 0.7) * 85);
        const b = Math.floor(40 + Math.pow(v, 2.2) * 210);
        setPx(x, y, r, Math.min(255, g), Math.min(255, b));
      }
    }
  } else if (bodyId === 'mercury') {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const n = fbm(x * 0.06, y * 0.06, 4, 21);
        const c2 = fbm(x * 0.2, y * 0.2, 3, 33);
        const base = 110 + n * 50 - c2 * 30;
        setPx(x, y, Math.max(0, base + 10), Math.max(0, base), Math.max(0, base - 10));
      }
    }
    // Crater dots
    for (let i = 0; i < 60; i++) {
      const cx = Math.random() * w;
      const cy = Math.random() * h;
      const cr = 4 + Math.random() * 14;
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(70,65,60,${0.5 + Math.random() * 0.3})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx - cr * 0.2, cy - cr * 0.2, cr * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180,175,170,${0.15})`;
      ctx.fill();
    }
    return c;
  } else if (bodyId === 'venus') {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        // Horizontal cloud swirls
        const n = fbm(x * 0.02, y * 0.08, 5, 17);
        const swirl = Math.sin(y * 0.04 + n * 6) * 0.5 + 0.5;
        const r = 220 + swirl * 30;
        const g = 165 + swirl * 50 - n * 20;
        const b = 80 + swirl * 30;
        setPx(x, y, Math.min(255, r), Math.min(255, g), Math.min(255, b));
      }
    }
  } else if (bodyId === 'earth') {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const cont = fbm(x * 0.025, y * 0.04, 5, 7);
        const lat = Math.abs(y - h / 2) / (h / 2);
        if (cont > 0.55) {
          // Land
          const green = 80 + (1 - lat) * 90;
          const brown = lat * 50;
          setPx(x, y, 70 + brown, green, 50 + brown * 0.5);
        } else {
          // Ocean
          const d = fbm(x * 0.05, y * 0.05, 3, 9);
          setPx(x, y, 30 + d * 20, 90 + d * 30, 160 + d * 40);
        }
        // Ice caps
        if (lat > 0.85) {
          const ice = (lat - 0.85) / 0.15;
          const i = (y * w + x) * 4;
          data[i] = Math.min(255, data[i] * (1 - ice) + 240 * ice);
          data[i + 1] = Math.min(255, data[i + 1] * (1 - ice) + 248 * ice);
          data[i + 2] = Math.min(255, data[i + 2] * (1 - ice) + 255 * ice);
        }
      }
    }
    // Cloud overlay
    ctx.putImageData(img, 0, 0);
    for (let i = 0; i < 30; i++) {
      const cx = Math.random() * w;
      const cy = Math.random() * h;
      const cw = 30 + Math.random() * 80;
      const ch = 8 + Math.random() * 20;
      ctx.beginPath();
      ctx.ellipse(cx, cy, cw, ch, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${0.15 + Math.random() * 0.25})`;
      ctx.fill();
    }
    return c;
  } else if (bodyId === 'mars') {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const n = fbm(x * 0.03, y * 0.04, 5, 5);
        const lat = Math.abs(y - h / 2) / (h / 2);
        const r = 180 + n * 50;
        const g = 80 + n * 30;
        const b = 50 + n * 20;
        setPx(x, y, Math.min(255, r), g, b);
        // Polar ice
        if (lat > 0.9) {
          const ice = (lat - 0.9) / 0.1;
          const i = (y * w + x) * 4;
          data[i] = data[i] * (1 - ice) + 240 * ice;
          data[i + 1] = data[i + 1] * (1 - ice) + 235 * ice;
          data[i + 2] = data[i + 2] * (1 - ice) + 230 * ice;
        }
      }
    }
  } else if (bodyId === 'jupiter') {
    for (let y = 0; y < h; y++) {
      // Band based on y
      const band = y / h;
      let baseR, baseG, baseB;
      // Bands of cream/tan/brown
      const bandPattern = Math.sin(band * Math.PI * 12) * 0.5 + 0.5;
      const turbulence = fbm(0, y * 0.08, 4, 27) * 0.3;
      for (let x = 0; x < w; x++) {
        const wave = Math.sin(x * 0.02 + y * 0.1 + fbm(x * 0.05, y * 0.05, 3, 31) * 3) * 0.3;
        const v = bandPattern + turbulence + wave;
        if (v > 0.5) {
          baseR = 220 + (v - 0.5) * 60;
          baseG = 180 + (v - 0.5) * 40;
          baseB = 140 + (v - 0.5) * 20;
        } else {
          baseR = 160 + v * 40;
          baseG = 110 + v * 50;
          baseB = 70 + v * 40;
        }
        setPx(x, y, Math.min(255, baseR), Math.min(255, baseG), Math.min(255, baseB));
      }
    }
    ctx.putImageData(img, 0, 0);
    // Great Red Spot
    const spotX = w * 0.7;
    const spotY = h * 0.6;
    const grad = ctx.createRadialGradient(spotX, spotY, 4, spotX, spotY, 35);
    grad.addColorStop(0, 'rgba(220,80,40,0.95)');
    grad.addColorStop(0.6, 'rgba(180,60,30,0.6)');
    grad.addColorStop(1, 'rgba(150,50,20,0)');
    ctx.beginPath();
    ctx.ellipse(spotX, spotY, 30, 16, 0, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    return c;
  } else if (bodyId === 'saturn') {
    for (let y = 0; y < h; y++) {
      const band = y / h;
      const bandPattern = Math.sin(band * Math.PI * 8) * 0.5 + 0.5;
      for (let x = 0; x < w; x++) {
        const wave = Math.sin(x * 0.015 + fbm(x * 0.04, y * 0.04, 3, 41) * 2) * 0.2;
        const v = bandPattern + wave;
        const r = 220 + v * 30;
        const g = 195 + v * 30;
        const b = 130 + v * 30;
        setPx(x, y, Math.min(255, r), Math.min(255, g), Math.min(255, b));
      }
    }
  } else if (bodyId === 'uranus') {
    for (let y = 0; y < h; y++) {
      const band = y / h;
      const bandPattern = Math.sin(band * Math.PI * 6) * 0.15;
      for (let x = 0; x < w; x++) {
        const n = fbm(x * 0.02, y * 0.04, 3, 51) * 0.1;
        const v = bandPattern + n;
        const r = 160 + v * 40;
        const g = 220 + v * 20;
        const b = 220 + v * 15;
        setPx(x, y, r, g, b);
      }
    }
  } else if (bodyId === 'neptune') {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const n = fbm(x * 0.025, y * 0.04, 4, 61);
        const band = Math.sin(y * 0.05) * 0.15;
        const r = 60 + n * 40 + band * 20;
        const g = 100 + n * 50 + band * 30;
        const b = 210 + n * 40;
        setPx(x, y, Math.max(0, r), Math.max(0, g), Math.min(255, b));
      }
    }
    ctx.putImageData(img, 0, 0);
    // Great Dark Spot
    const spotX = w * 0.3;
    const spotY = h * 0.4;
    const grad = ctx.createRadialGradient(spotX, spotY, 4, spotX, spotY, 28);
    grad.addColorStop(0, 'rgba(15,30,90,0.85)');
    grad.addColorStop(1, 'rgba(15,30,90,0)');
    ctx.beginPath();
    ctx.ellipse(spotX, spotY, 24, 12, 0, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    return c;
  } else if (bodyId === 'pluto') {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const n = fbm(x * 0.04, y * 0.04, 4, 71);
        const lat = (y - h / 2) / (h / 2);
        // Heart-shaped lighter region
        const heartU = (x / w - 0.5) * 2;
        const heartV = (y / h - 0.55) * 2;
        const heartDist = Math.sqrt(heartU * heartU * 1.5 + heartV * heartV);
        const heart = Math.max(0, 1 - heartDist * 1.4);
        const r = 170 + n * 50 + heart * 60;
        const g = 130 + n * 40 + heart * 70;
        const b = 100 + n * 30 + heart * 70;
        setPx(x, y, Math.min(255, r), Math.min(255, g), Math.min(255, b));
      }
    }
  }

  ctx.putImageData(img, 0, 0);
  return c;
}

// Saturn ring color stripe (used as 1D texture for ring)
function generateSaturnRingTexture() {
  const size = 256;
  const c = makeCanvas(size, 1);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, 1);
  for (let i = 0; i < size; i++) {
    const t = i / size;
    // Ring divisions (Cassini gap etc.)
    let alpha = 0.95;
    if (t < 0.05 || t > 0.97) alpha = 0;
    else if (t > 0.62 && t < 0.66) alpha = 0.2; // Cassini Division
    else if (t > 0.92) alpha = 0.4;
    const banding = 0.7 + 0.3 * Math.sin(t * 80) * 0.5 + 0.3 * Math.sin(t * 200);
    const r = (210 + banding * 30) * (1 - t * 0.2);
    const g = (180 + banding * 25) * (1 - t * 0.2);
    const b = (130 + banding * 20) * (1 - t * 0.1);
    img.data[i * 4] = r;
    img.data[i * 4 + 1] = g;
    img.data[i * 4 + 2] = b;
    img.data[i * 4 + 3] = alpha * 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

// Generic ring texture (for Uranus/Neptune — thin and dark)
function generateThinRingTexture(baseColor) {
  const size = 128;
  const c = makeCanvas(size, 1);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, 1);
  for (let i = 0; i < size; i++) {
    const t = i / size;
    let alpha = 0.5;
    if (t < 0.2 || t > 0.95) alpha = 0;
    // Few narrow ringlets
    const ringlet = (Math.abs(t - 0.35) < 0.02 || Math.abs(t - 0.55) < 0.02 || Math.abs(t - 0.75) < 0.03) ? 0.6 : 0.1;
    alpha *= ringlet * 1.6;
    img.data[i * 4] = baseColor[0];
    img.data[i * 4 + 1] = baseColor[1];
    img.data[i * 4 + 2] = baseColor[2];
    img.data[i * 4 + 3] = Math.min(220, alpha * 255);
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

// Format helpers
function fmtDistance(km) {
  if (km >= 1e9) return (km / 1e9).toFixed(2) + ' billion km';
  if (km >= 1e6) return (km / 1e6).toFixed(2) + ' million km';
  return km.toLocaleString() + ' km';
}
function fmtAU(au) { return au.toFixed(3) + ' AU'; }
function fmtPeriod(days) {
  if (!days) return 'N/A';
  if (days > 365 * 2) return (days / 365.25).toFixed(1) + ' years';
  if (days > 1) return days.toFixed(1) + ' days';
  return (days * 24).toFixed(1) + ' hours';
}
function fmtTemp(c) { return c.toLocaleString() + ' °C'; }

// Light-time from Sun (minutes)
function lightTimeMinutes(au) {
  // Light speed: 1 AU in 8.317 minutes
  return au * 8.317;
}
function fmtLightTime(minutes) {
  if (minutes < 1) return (minutes * 60).toFixed(1) + ' s';
  if (minutes < 60) return minutes.toFixed(1) + ' min';
  const hours = minutes / 60;
  if (hours < 24) return hours.toFixed(2) + ' hr';
  return (hours / 24).toFixed(1) + ' days';
}

// Orbital velocity (rough): v = sqrt(GM/r)
function orbitalVelocityKmS(au) {
  const r = au * 1.496e11; // metres
  const GM = 1.327e20; // m³/s² for Sun
  return Math.sqrt(GM / r) / 1000;
}

window.SOL_DATA = SOL_DATA;
window.SCALE_3D = SCALE_3D;
window.scaleDistance3D = scaleDistance3D;
window.scaleDiameter3D = scaleDiameter3D;
window.scaleMoonDiameter3D = scaleMoonDiameter3D;
window.scaleMoonDistance3D = scaleMoonDistance3D;
window.scaleSmallBodyDiameter3D = scaleSmallBodyDiameter3D;
window.generateTexture = generateTexture;
window.generateSaturnRingTexture = generateSaturnRingTexture;
window.generateThinRingTexture = generateThinRingTexture;
window.fmtDistance = fmtDistance;
window.fmtAU = fmtAU;
window.fmtPeriod = fmtPeriod;
window.fmtTemp = fmtTemp;
window.lightTimeMinutes = lightTimeMinutes;
window.fmtLightTime = fmtLightTime;
window.orbitalVelocityKmS = orbitalVelocityKmS;
