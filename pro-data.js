// ============================================================
// SOLAR 3D · PRO DATA
// Real astronomical reference data for the professional tool layer:
//   · BRIGHT_STARS  — curated brightest-star catalogue (real RA/Dec/mag)
//   · NEO_OBJECTS   — notable near-Earth asteroids & close approaches
//   · GRAND_TOUR    — ordered cinematic narration script
// Public-domain astronomical facts; positions are catalogue-accurate to
// display precision, not for navigation.
// ============================================================
(function () {
  // ── Brightest stars · RA (hours), Dec (deg), apparent mag, sRGB tint ──
  // Tints approximate each star's B–V colour index / spectral class.
  const BRIGHT_STARS = [
    ['Sirius',        6.752,  -16.716, -1.46, '#9bb4ff'],
    ['Canopus',       6.399,  -52.696, -0.74, '#fff4e8'],
    ['Rigil Kentaurus',14.660,-60.834, -0.27, '#fff1d6'],
    ['Arcturus',     14.261,  19.182, -0.05, '#ffd9a0'],
    ['Vega',         18.616,  38.784,  0.03, '#cfe0ff'],
    ['Capella',       5.278,  45.998,  0.08, '#ffe9b8'],
    ['Rigel',         5.242,  -8.202,  0.13, '#cdd9ff'],
    ['Procyon',       7.655,   5.225,  0.34, '#fdfbf2'],
    ['Betelgeuse',    5.919,   7.407,  0.50, '#ffb37a'],
    ['Achernar',      1.629, -57.237,  0.46, '#cfe0ff'],
    ['Hadar',        14.064, -60.373,  0.61, '#cdd9ff'],
    ['Altair',       19.846,   8.868,  0.77, '#f4f6ff'],
    ['Acrux',        12.443, -63.099,  0.76, '#cdd9ff'],
    ['Aldebaran',     4.599,  16.509,  0.85, '#ffc98a'],
    ['Antares',      16.490, -26.432,  0.96, '#ffa765'],
    ['Spica',        13.420, -11.161,  0.97, '#c6d6ff'],
    ['Pollux',        7.755,  28.026,  1.14, '#ffd9a0'],
    ['Fomalhaut',    22.961, -29.622,  1.16, '#eef2ff'],
    ['Deneb',        20.690,  45.280,  1.25, '#eef2ff'],
    ['Mimosa',       12.795, -59.689,  1.25, '#cdd9ff'],
    ['Regulus',      10.139,  11.967,  1.35, '#dbe6ff'],
    ['Adhara',        6.977, -28.972,  1.50, '#cdd9ff'],
    ['Castor',        7.577,  31.888,  1.57, '#f4f6ff'],
    ['Shaula',       17.560, -37.104,  1.62, '#cdd9ff'],
    ['Gacrux',       12.519, -57.113,  1.63, '#ffb37a'],
    ['Bellatrix',     5.418,   6.350,  1.64, '#cdd9ff'],
    ['Elnath',        5.438,  28.608,  1.65, '#eef2ff'],
    ['Miaplacidus',   9.220, -69.717,  1.69, '#eef2ff'],
    ['Alnilam',       5.604,  -1.202,  1.69, '#cdd9ff'],
    ['Alnitak',       5.679,  -1.943,  1.77, '#cdd9ff'],
    ['Alioth',       12.900,  55.960,  1.77, '#f4f6ff'],
    ['Dubhe',        11.062,  61.751,  1.79, '#ffd9a0'],
    ['Mirfak',        3.405,  49.861,  1.79, '#fff4e8'],
    ['Wezen',         7.140, -26.393,  1.83, '#fff4e8'],
    ['Kaus Australis',18.403,-34.385,  1.85, '#eef2ff'],
    ['Alkaid',       13.792,  49.313,  1.86, '#cdd9ff'],
    ['Polaris',       2.530,  89.264,  1.98, '#fff4e8'],
    ['Alphard',       9.460,  -8.659,  1.99, '#ffc98a'],
    ['Hamal',         2.119,  23.462,  2.00, '#ffd9a0'],
    ['Algol',         3.136,  40.956,  2.12, '#dbe6ff'],
    ['Denebola',     11.818,  14.572,  2.11, '#eef2ff'],
    ['Mizar',        13.399,  54.925,  2.04, '#f4f6ff'],
    ['Nunki',        18.921, -26.297,  2.05, '#cdd9ff'],
    ['Alpheratz',     0.140,  29.090,  2.06, '#dbe6ff'],
  ];

  // ── Notable near-Earth objects (real close approaches) ──
  // missDistLD = closest miss in lunar distances (1 LD ≈ 384,400 km).
  const NEO_OBJECTS = [
    { id: 'apophis',   name: '99942 Apophis',   diaM: 370, date: '2029-04-13', missDistLD: 0.10, hazard: true,  note: 'Will pass closer than geostationary satellites in 2029 — visible to the naked eye over Europe & Africa.' },
    { id: 'bennu',     name: '101955 Bennu',    diaM: 490, date: '2135-09-25', missDistLD: 0.50, hazard: true,  note: 'OSIRIS-REx sample target; a small impact probability in the late 2100s keeps it closely tracked.' },
    { id: '2024yr4',   name: '2024 YR4',        diaM: 55,  date: '2032-12-22', missDistLD: 0.13, hazard: true,  note: 'Briefly held the highest impact rating ever recorded before further tracking cleared it.' },
    { id: 'didymos',   name: '65803 Didymos',   diaM: 780, date: '2123-11-04', missDistLD: 15.8, hazard: false, note: 'Its moonlet Dimorphos was deliberately struck by NASA\u2019s DART mission in 2022 — first planetary-defence test.' },
    { id: 'toutatis',  name: '4179 Toutatis',   diaM: 2800,date: '2069-11-05', missDistLD: 7.7,  hazard: false, note: 'A tumbling, elongated rock imaged by China\u2019s Chang\u2019e 2 during a 2012 flyby.' },
    { id: 'phaethon',  name: '3200 Phaethon',   diaM: 5100,date: '2093-12-14', missDistLD: 7.9,  hazard: true,  note: 'Parent body of the Geminid meteor shower; a rare rock comet that brightens near the Sun.' },
  ];

  // ── Cinematic Grand Tour — ordered narration ──
  const GRAND_TOUR = [
    { body: 'sun',     title: 'The Sun',      caption: '99.86% of the system\u2019s mass — a 1.4-million-km sphere of plasma anchoring every orbit you see.', dwell: 6200 },
    { body: 'mercury', title: 'Mercury',     caption: 'The swift inner world — a sun-scorched dayside and a 167\u00B0C swing to its frozen night.', dwell: 5600 },
    { body: 'venus',   title: 'Venus',       caption: 'Earth\u2019s twin gone wrong: a runaway greenhouse holding a 465\u00B0C surface beneath sulphuric cloud.', dwell: 5600 },
    { body: 'earth',   title: 'Earth',       caption: 'The pale blue dot — the only world we know cradles liquid oceans and life.', dwell: 6200 },
    { body: 'mars',    title: 'Mars',        caption: 'The rusted desert world, scarred by the largest volcano and deepest canyon in the system.', dwell: 5600 },
    { body: 'jupiter', title: 'Jupiter',     caption: 'A 318-Earth-mass giant whose Great Red Spot is a storm wider than our entire planet.', dwell: 6200 },
    { body: 'saturn',  title: 'Saturn',      caption: 'The jewel of the system — rings 280,000 km across yet, in places, only metres thick.', dwell: 6200 },
    { body: 'uranus',  title: 'Uranus',      caption: 'The tipped ice giant, rolling through its 84-year orbit on its side.', dwell: 5600 },
    { body: 'neptune', title: 'Neptune',     caption: 'The windswept frontier — supersonic 2,100 km/h gales on the outermost giant.', dwell: 6200 },
  ];

  window.BRIGHT_STARS = BRIGHT_STARS;
  window.NEO_OBJECTS = NEO_OBJECTS;
  window.GRAND_TOUR = GRAND_TOUR;
})();
