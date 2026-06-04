// ============================================================
// EXTRA BODIES — Dwarf planets, comets, spacecraft
// Loaded after data-3d.js and orbital-mechanics.js
// ============================================================

// ─── DWARF PLANETS (extending SOL_DATA-style entries) ─────────────
// Note: orbital elements (a, e, i, etc.) live in orbital-mechanics.js
const DWARF_PLANETS = [
  {
    id: 'ceres', name: 'Ceres', type: 'dwarf_planet',
    diameterKm: 939.4, distanceAU: 2.766,
    averageDistanceFromSunKm: 413.7e6, orbitalPeriodDays: 1680,
    rotationPeriodHours: 9.07, axialTiltDeg: 4.0,
    moons: 0, hasRings: false,
    color: '#9C8C7A', emissive: '#000000',
    surfaceTempC: -105, mass: '9.39×10²⁰ kg',
    gravityMS2: 0.27, densityGcc: 2.16, escapeVelKmS: 0.51,
    atmospherePressure: 'Tenuous water-vapour exosphere',
    discoveredBy: 'Giuseppe Piazzi', discoveredYear: 1801,
    composition: 'Water-ice mantle, hydrated silicate rocky core',
    shortDescription: 'Largest object in the asteroid belt and the only dwarf planet of the inner Solar System. Surface salt deposits hint at a briny subsurface ocean.',
    facts: [
      'Contains about a third of the total mass of the asteroid belt.',
      'NASA\'s Dawn mission orbited Ceres from 2015 to 2018.',
      'The bright spots in Occator Crater are sodium-carbonate salts.',
      'Was the first object reclassified — from asteroid to dwarf planet in 2006.',
    ],
    notableMoons: [],
  },
  {
    id: 'eris', name: 'Eris', type: 'dwarf_planet',
    diameterKm: 2326, distanceAU: 67.864,
    averageDistanceFromSunKm: 10.15e9, orbitalPeriodDays: 203450,   // 557 yr
    rotationPeriodHours: 25.9, axialTiltDeg: 78.0,
    moons: 1, hasRings: false,
    color: '#D5D0C8', emissive: '#000000',
    surfaceTempC: -243, mass: '1.66×10²² kg',
    gravityMS2: 0.82, densityGcc: 2.43, escapeVelKmS: 1.38,
    atmospherePressure: 'Frozen N₂ at aphelion; sublimates at perihelion',
    discoveredBy: 'Brown, Trujillo & Rabinowitz', discoveredYear: 2005,
    composition: 'Rock & nitrogen/methane ices',
    shortDescription: 'Most massive known dwarf planet — slightly heavier than Pluto. Its discovery triggered the 2006 IAU debate that demoted Pluto.',
    facts: [
      'Mass 27% greater than Pluto, despite slightly smaller diameter.',
      'Highly inclined orbit (44°) and very eccentric (e = 0.44).',
      'One moon: Dysnomia, discovered shortly after Eris itself.',
      'Surface temperature varies from −243 °C at aphelion to −217 °C at perihelion.',
    ],
    notableMoons: [
      { id: 'dysnomia', name: 'Dysnomia', diameterKm: 700, distFromParentKm: 37273, orbitalPeriodDays: 15.79, eccentricity: 0.005, inclinationDeg: 0, color: '#8C8B82', desc: 'Eris\'s only moon, used to determine Eris\'s mass precisely.' },
    ],
  },
  {
    id: 'makemake', name: 'Makemake', type: 'dwarf_planet',
    diameterKm: 1430, distanceAU: 45.79,
    averageDistanceFromSunKm: 6.85e9, orbitalPeriodDays: 113183,    // 310 yr
    rotationPeriodHours: 22.83, axialTiltDeg: 0,
    moons: 1, hasRings: false,
    color: '#A86E4C', emissive: '#000000',
    surfaceTempC: -243, mass: '~3.1×10²¹ kg',
    gravityMS2: 0.47, densityGcc: 2.1, escapeVelKmS: 0.83,
    atmospherePressure: 'No detectable atmosphere',
    discoveredBy: 'Brown, Trujillo & Rabinowitz', discoveredYear: 2005,
    composition: 'Methane, ethane and nitrogen ices',
    shortDescription: 'Largest classical Kuiper Belt object; reddish methane-rich surface. Named after the Rapa Nui creator god.',
    facts: [
      'Surface dominated by frozen methane — among the reddest large bodies known.',
      'Has one small moon, MK 2, discovered by Hubble in 2016.',
      'No atmosphere was detected during its 2011 stellar occultation.',
      'Its discovery (along with Eris and Haumea) prompted the new dwarf-planet class.',
    ],
    notableMoons: [
      { id: 'mk2', name: 'MK 2', diameterKm: 175, distFromParentKm: 21000, orbitalPeriodDays: 12, eccentricity: 0.03, inclinationDeg: 0, color: '#403835', desc: 'A small, dark satellite — barely 1/100th the brightness of Makemake.' },
    ],
  },
  {
    id: 'haumea', name: 'Haumea', type: 'dwarf_planet',
    diameterKm: 1632, distanceAU: 43.13,
    averageDistanceFromSunKm: 6.45e9, orbitalPeriodDays: 103774,    // 284 yr
    rotationPeriodHours: 3.915, axialTiltDeg: 0,
    moons: 2, hasRings: true,
    color: '#CFCFCF', emissive: '#000000',
    surfaceTempC: -241, mass: '4.01×10²¹ kg',
    gravityMS2: 0.40, densityGcc: 2.6, escapeVelKmS: 0.91,
    atmospherePressure: 'No detectable atmosphere',
    discoveredBy: 'Brown / Ortiz team (contested)', discoveredYear: 2004,
    composition: 'Crystalline water ice over a rocky core',
    shortDescription: 'A rapidly-spinning ellipsoid — its 3.9-hour rotation has stretched it into a 2:1 axis-ratio shape, the most elongated large body in the Solar System.',
    facts: [
      'Rotates once every 3.9 hours — fastest of any body over 100 km.',
      'Has a thin ring discovered by stellar occultation in 2017.',
      'Two moons: Hi\'iaka (310 km) and Namaka (170 km).',
      'Roughly the shape of a 2,322 × 1,704 × 1,026 km ellipsoid.',
    ],
    notableMoons: [
      { id: 'hiiaka',  name: 'Hi\'iaka',  diameterKm: 310, distFromParentKm: 49880, orbitalPeriodDays: 49.46, eccentricity: 0.0513, inclinationDeg: 14.78, color: '#C2BEB3', desc: 'Outer of Haumea\'s two moons; possibly an icy collision fragment.' },
      { id: 'namaka',  name: 'Namaka',  diameterKm: 170, distFromParentKm: 25657, orbitalPeriodDays: 18.28, eccentricity: 0.249, inclinationDeg: 13.41, color: '#A6A39A', desc: 'Inner moon; orbit is significantly inclined relative to Hi\'iaka.' },
    ],
  },
];

// ─── COMETS ─────────────────────────────────────────────
// Each orbital element block: a (AU), e, i (deg), omegaBar (deg), OmegaNode (deg), periheliondate (ISO string)
const COMETS = [
  {
    id: 'halley', name: '1P/Halley',
    color: '#7BD3F0',
    diameterKm: 11,
    elements: {
      a: 17.834, e: 0.96714, i: 162.262,
      omegaBar: 58.42 + 111.33, OmegaNode: 58.42,
      periheliondate: '1986-02-09T00:00:00Z',
      retrograde: true,
    },
    description: 'Most famous of all comets — returns every 75–76 years. Last perihelion 1986; next 2061. The Bayeux Tapestry depicts its 1066 apparition.',
    facts: [
      'First periodic comet recognised (by Edmund Halley in 1705).',
      'Nucleus measures ~15 × 8 km — peanut-shaped.',
      'Retrograde orbit (inclination 162°) — orbits backwards relative to the planets.',
      'Source of two annual meteor showers: η Aquariids (May) and Orionids (October).',
    ],
  },
  {
    id: 'halebopp', name: 'C/1995 O1 (Hale-Bopp)',
    color: '#A8D8FF',
    diameterKm: 60,
    elements: {
      a: 186, e: 0.995086, i: 89.43,
      omegaBar: 130.59 + 282.47, OmegaNode: 282.47,
      periheliondate: '1997-04-01T00:00:00Z',
    },
    description: 'The Great Comet of 1997 — visible to the naked eye for 18 months, longer than any comet in recorded history. Will return around 4385 CE.',
    facts: [
      'Discovered independently by Alan Hale and Thomas Bopp on 23 July 1995.',
      'Unusually large nucleus (~60 km) — over 30× Halley\'s.',
      'Two distinct tails were clearly visible: ion (blue) and dust (white-yellow).',
      'Orbital period of ~2,500 years.',
    ],
  },
  {
    id: 'neowise', name: 'C/2020 F3 (NEOWISE)',
    color: '#F5C8A8',
    diameterKm: 5,
    elements: {
      a: 358.5, e: 0.99918, i: 128.94,
      omegaBar: 37.28 + 22.81, OmegaNode: 22.81,
      periheliondate: '2020-07-03T00:00:00Z',
      retrograde: true,
    },
    description: 'Brightest naked-eye comet visible from the Northern Hemisphere since Hale-Bopp. Will not return for ~6,800 years.',
    facts: [
      'Discovered by NASA\'s NEOWISE space telescope in March 2020.',
      'Survived perihelion passage at only 0.295 AU from the Sun.',
      'Tail extended over 20° in the July 2020 evening sky.',
      'Highly eccentric orbit (e = 0.999) — barely bound to the Sun.',
    ],
  },
  {
    id: 'encke', name: '2P/Encke',
    color: '#9FE6C8',
    diameterKm: 4.8,
    elements: {
      a: 2.215, e: 0.8483, i: 11.78,
      omegaBar: 186.55 + 334.57, OmegaNode: 334.57,
      periheliondate: '2023-10-22T00:00:00Z',
    },
    description: 'Shortest orbital period of any known comet — just 3.3 years. Parent body of the Taurid meteor shower.',
    facts: [
      'Orbital period of only 3.3 years — the shortest of any comet.',
      'Second comet found to be periodic, after Halley (by Johann Encke, 1819).',
      'Source of the Taurid meteor stream seen each autumn.',
      'Has lost most of its volatiles — its tail is now faint and dust-poor.',
    ],
  },
  {
    id: 'lovejoy', name: 'C/2011 W3 (Lovejoy)',
    color: '#CFE8FF',
    diameterKm: 0.5,
    elements: {
      a: 157, e: 0.99992, i: 134.4,
      omegaBar: 53.6 + 94.2, OmegaNode: 94.2,
      periheliondate: '2011-12-16T00:00:00Z',
      retrograde: true,
    },
    description: 'A Kreutz sungrazer that astonished astronomers by surviving a passage just 140,000 km above the Sun\'s surface in December 2011.',
    facts: [
      'Skimmed only 140,000 km above the solar photosphere and survived.',
      'Belongs to the Kreutz family — fragments of one giant comet that broke up.',
      'Filmed from the ISS by astronaut Dan Burbank as it rounded the Sun.',
      'Its tail was torn off by the Sun\'s magnetic field during perihelion.',
    ],
  },
];

// ─── NEAREST STARS (beyond the Solar System) ──────────────────────
// Positions given as galactic-ish unit directions (approx, for placement
// on a distant shell) plus real distances in light-years. Rendered as
// labelled billboard sprites by scene-3d when the layer is toggled on.
const NEARBY_STARS = [
  { id: 'proxima',     name: 'Proxima Centauri', lightYears: 4.25, color: '#FF6B4A', type: 'Red dwarf',     dir: { x: -0.49, y: -0.10, z: -0.86 }, note: 'Closest star to the Sun; hosts at least one planet in its habitable zone (Proxima b).' },
  { id: 'alphacen',    name: 'Alpha Centauri A/B', lightYears: 4.37, color: '#FFE9B0', type: 'G2 + K1 binary', dir: { x: -0.50, y: -0.11, z: -0.86 }, note: 'A Sun-like pair; the brightest stars of Centaurus and the prime target for interstellar probe concepts.' },
  { id: 'barnard',     name: "Barnard's Star",   lightYears: 5.96, color: '#FF7A50', type: 'Red dwarf',     dir: { x: 0.18, y: 0.42, z: 0.89 }, note: 'Fastest proper motion of any star; a sub-Earth planet candidate was reported in 2024.' },
  { id: 'wolf359',     name: 'Wolf 359',         lightYears: 7.86, color: '#FF5C3A', type: 'Red dwarf',     dir: { x: 0.93, y: 0.30, z: 0.20 }, note: 'One of the faintest and lowest-mass stars known; a flare star.' },
  { id: 'sirius',      name: 'Sirius A/B',       lightYears: 8.66, color: '#CFE3FF', type: 'A1 + white dwarf', dir: { x: 0.93, y: -0.30, z: -0.20 }, note: 'Brightest star in Earth\'s night sky; its companion was the first white dwarf identified.' },
  { id: 'epseri',      name: 'Epsilon Eridani',  lightYears: 10.5, color: '#FFD27A', type: 'K2 dwarf',      dir: { x: 0.74, y: -0.40, z: 0.54 }, note: 'A young Sun-like star with a debris disk and a confirmed gas-giant planet.' },
  { id: 'tau-ceti',    name: 'Tau Ceti',         lightYears: 11.9, color: '#FFE9C0', type: 'G8 dwarf',      dir: { x: 0.62, y: -0.55, z: 0.56 }, note: 'A stable, metal-poor Sun analogue with multiple candidate planets.' },
];

// ─── SPACECRAFT ─────────────────────────────────────────────
// Each spacecraft has a `positionAU(date)` function returning {x,y,z} in
// heliocentric AU coords (scene Y-up — same convention as planets). These
// are approximations chosen for visual fidelity, not navigational use.
//
// All real positions queried from JPL Horizons (epoch 2024).
// ─────────────────────────────────────────────────────────────
const SPACECRAFT = [
  {
    id: 'voyager1', name: 'Voyager 1',
    color: '#F0D070',
    launched: '1977-09-05',
    blurb: 'Most distant human-made object. In interstellar space since August 2012.',
    // Snapshot from JPL Horizons at 2024 Jan 1 + linear outward motion at 16.99 km/s
    // 1 km/s = 0.211 AU/yr at Sun-relative velocity ≈ 3.6 AU/yr along +x +y direction.
    refDate: '2024-01-01T00:00:00Z',
    refPos: { x: 119.2, y: 36.5, z: 11.4 },      // heliocentric AU, scene Y-up
    velAUperDay: { x: 0.00922, y: 0.00148, z: 0.00125 },  // ~16.99 km/s direction
  },
  {
    id: 'voyager2', name: 'Voyager 2',
    color: '#E0B860',
    launched: '1977-08-20',
    blurb: 'Only spacecraft to visit Uranus & Neptune. In interstellar space since November 2018.',
    refDate: '2024-01-01T00:00:00Z',
    refPos: { x: 71.5, y: -57.4, z: -36.8 },
    velAUperDay: { x: 0.00455, y: -0.00598, z: -0.00284 },  // ~15.4 km/s
  },
  {
    id: 'parker', name: 'Parker Solar Probe',
    color: '#FF7A50',
    launched: '2018-08-12',
    blurb: 'First spacecraft to "touch" the Sun — flew through the corona in 2021.',
    // Highly elliptical solar orbit — simulate via Keplerian elements
    elements: {
      a: 0.388, e: 0.853, i: 3.41,
      omegaBar: 169.71, OmegaNode: 78.55,
      periheliondate: '2024-12-24T00:00:00Z',
      retrograde: false,
    },
  },
  {
    id: 'jwst', name: 'James Webb Space Telescope',
    color: '#FFD700',
    launched: '2021-12-25',
    blurb: 'Largest space telescope — orbiting the Sun-Earth L2 Lagrange point at 1.01 AU.',
    // L2: ~0.01 AU from Earth, on the anti-Sun side. We compute from Earth.
    followsBody: 'earth',
    offsetAU: 0.01,        // away from Sun along Sun-Earth line
  },
  {
    id: 'newhorizons', name: 'New Horizons',
    color: '#9CD7FF',
    launched: '2006-01-19',
    blurb: 'Pluto flyby 2015; Arrokoth flyby 2019. Currently in the Kuiper Belt.',
    refDate: '2024-01-01T00:00:00Z',
    refPos: { x: 27.2, y: 6.1, z: -8.7 },
    velAUperDay: { x: 0.00770, y: 0.00094, z: -0.00133 },  // ~14.0 km/s outbound
  },
  {
    id: 'pioneer10', name: 'Pioneer 10',
    color: '#A8A8B8',
    launched: '1972-03-02',
    blurb: 'First spacecraft to traverse the asteroid belt and visit Jupiter. Last signal: January 2003.',
    refDate: '2024-01-01T00:00:00Z',
    refPos: { x: 73.0, y: -56.0, z: 14.0 },
    velAUperDay: { x: 0.00650, y: -0.00120, z: 0.00110 },
  },
];

// Compute a spacecraft's scene-coord position (AU, Y-up) at given date.
function spacecraftPositionAU(craft, date) {
  if (craft.elements) {
    // Keplerian (Parker)
    return window.OrbitalMechanics.cometHeliocentricAU(craft.elements, date);
  }
  if (craft.followsBody) {
    // JWST = Earth position pushed away from Sun by 0.01 AU
    const earth = window.OrbitalMechanics.planetHeliocentricAU(craft.followsBody, date);
    if (!earth) return { x: 0, y: 0, z: 0 };
    // Direction Sun→Earth, push by offsetAU
    const r = Math.hypot(earth.x, earth.y, earth.z);
    const off = (craft.offsetAU || 0) / r;
    return {
      x: earth.x * (1 + off),
      y: earth.y * (1 + off),
      z: earth.z * (1 + off),
    };
  }
  // Linear extrapolation from reference snapshot
  if (craft.refDate && craft.refPos && craft.velAUperDay) {
    const days = (date.getTime() - new Date(craft.refDate).getTime()) / 86400000;
    return {
      x: craft.refPos.x + craft.velAUperDay.x * days,
      y: craft.refPos.y + craft.velAUperDay.y * days,
      z: craft.refPos.z + craft.velAUperDay.z * days,
    };
  }
  return { x: 0, y: 0, z: 0 };
}

// ─── ASTRONOMICAL EVENTS (date-tagged for timeline) ───────────────
const ASTRO_EVENTS = [
  { date: '2020-12-21', body: 'jupiter', title: 'Great Conjunction', desc: 'Jupiter and Saturn appeared just 0.1° apart — the closest visible alignment since 1226.' },
  { date: '2022-12-08', body: 'mars',    title: 'Mars Opposition',   desc: 'Mars was directly opposite the Sun from Earth — brightest naked-eye Mars in years.' },
  { date: '2024-04-08', body: 'sun',     title: 'Total Solar Eclipse', desc: 'Path of totality crossed Mexico, USA and Canada. Watched live by over 50 million.' },
  { date: '2024-09-08', body: 'saturn',  title: 'Saturn Opposition', desc: 'Closest annual approach — rings appeared maximally bright.' },
  { date: '2025-01-16', body: 'mars',    title: 'Mars Opposition',   desc: 'Mars next opposition — brighter than usual due to perihelion proximity.' },
  { date: '2026-08-12', body: 'sun',     title: 'Total Solar Eclipse', desc: 'Path of totality crosses Greenland, Iceland and Spain.' },
  { date: '2061-07-28', body: 'halley',  title: 'Halley\'s Return',  desc: 'Predicted perihelion passage of comet 1P/Halley.' },
  { date: '2030-08-08', body: 'jwst',    title: 'JWST 10-Year Mark', desc: 'A decade since JWST\'s deployment at L2. Mission could extend to 20+ years.' },
];

// ─── EDUCATIONAL TOURS ─────────────────────────────────────────────
const TOURS = [
  {
    id: 'grand',
    name: 'Grand Tour',
    description: 'Visit every major body in order — the Voyager dream.',
    steps: [
      { bodyId: 'sun',     narration: 'We begin at the heart of the system. The Sun contains 99.86% of all mass — every planet is a leftover scrap.' },
      { bodyId: 'mercury', narration: 'Mercury — small, fast, cooked on one side and frozen on the other.' },
      { bodyId: 'venus',   narration: 'Venus is Earth\'s twin in size but a runaway greenhouse. Surface pressure equivalent to 900 m underwater.' },
      { bodyId: 'earth',   narration: 'Home — and the only world where we know complex chemistry crossed into biology.' },
      { bodyId: 'mars',    narration: 'Mars — the red desert. Once warm and wet; today every river bed is frozen dust.' },
      { bodyId: 'jupiter', narration: 'Jupiter — the king. More massive than all other planets combined.' },
      { bodyId: 'saturn',  narration: 'Saturn — rings of ice no thicker than a city. A density so low the planet would float.' },
      { bodyId: 'uranus',  narration: 'Uranus — knocked on its side. Each pole faces the Sun for 42 years.' },
      { bodyId: 'neptune', narration: 'Neptune — winds at 2,100 km/h on a world that takes 165 years to orbit.' },
      { bodyId: 'pluto',   narration: 'Pluto — the gateway to the Kuiper Belt. Heart-shaped nitrogen plains visited only once.' },
    ],
  },
  {
    id: 'inner',
    name: 'Inner Planets',
    description: 'The four terrestrial worlds — and what makes each unique.',
    steps: [
      { bodyId: 'mercury', narration: 'Closest to the Sun. The day-night swing exceeds 600°C — the most extreme of any planet.' },
      { bodyId: 'venus',   narration: 'Slowest rotation in the Solar System. The Sun, if visible through the clouds, would rise in the west.' },
      { bodyId: 'earth',   narration: 'Liquid water surface, a magnetic shield, and a single large moon stabilising the axial tilt.' },
      { bodyId: 'mars',    narration: 'Half Earth\'s diameter, a tenth of its mass. Lost its magnetic field — and most of its atmosphere — billions of years ago.' },
    ],
  },
  {
    id: 'gasgiants',
    name: 'Gas Giants',
    description: 'Jupiter and Saturn — failed stars that dominate the outer system.',
    steps: [
      { bodyId: 'jupiter', narration: 'Spins fastest of all planets. The Great Red Spot has raged for centuries, larger than Earth itself.' },
      { bodyId: 'saturn',  narration: '282,000 km of ring system — only 10-100 metres thick. Made of 90% water ice.' },
    ],
  },
  {
    id: 'icegiants',
    name: 'Ice Giants',
    description: 'Uranus and Neptune — Voyager 2\'s last destinations.',
    steps: [
      { bodyId: 'uranus',  narration: 'Coldest planetary atmosphere in the Solar System: −224°C. Tilted 98° from vertical.' },
      { bodyId: 'neptune', narration: 'Predicted by mathematics before anyone saw it. Internal heat radiates more energy than it receives.' },
    ],
  },
  {
    id: 'tidal',
    name: 'Tidal Locking',
    description: 'How gravity slows rotations until one face always points home.',
    steps: [
      { bodyId: 'earth',   narration: 'The Moon orbits Earth with the same face always pointing toward us — tidally locked over billions of years.' },
      { bodyId: 'jupiter', narration: 'All four Galilean moons are tidally locked to Jupiter. Io\'s tidal flexing powers its volcanism.' },
      { bodyId: 'pluto',   narration: 'Pluto and Charon are mutually locked — each shows the same face to the other, permanently.' },
    ],
  },
  {
    id: 'ocean-worlds',
    name: 'Ocean Worlds',
    description: 'Hidden seas beneath ice — the new frontier of astrobiology.',
    steps: [
      { bodyId: 'jupiter', narration: 'Europa, beneath Jupiter\'s magnetic glare — a 100-km-deep saltwater ocean under an ice shell.' },
      { bodyId: 'saturn',  narration: 'Enceladus vents water vapour from a subsurface ocean. Molecular hydrogen suggests hydrothermal vents.' },
      { bodyId: 'saturn',  narration: 'Titan — methane lakes on the surface, water ocean below. The only moon with a thick atmosphere.' },
    ],
  },
];

window.DWARF_PLANETS = DWARF_PLANETS;
window.COMETS = COMETS;
window.SPACECRAFT = SPACECRAFT;
window.spacecraftPositionAU = spacecraftPositionAU;
window.ASTRO_EVENTS = ASTRO_EVENTS;
window.TOURS = TOURS;
window.NEARBY_STARS = NEARBY_STARS;
