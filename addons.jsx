/* ============================================================
   SOLAR 3D · ADD-ONS MODULE
   Mounted as a separate React root in #addons-root so the core
   app stays untouched. Provides:
     · Türkçe yerelleştirme (DOM translation layer, EN⇄TR)
     · Gök olayları zaman makinesi (events time-machine)
     · Karşılaştırmalı ölçek (scale comparison)
     · Quiz / öğrenme modu + rozetler
     · Yüzey görünümü (surface explorer, mini THREE scene)
     · Ambient uzay sesi (Web Audio drone)
     · Derin uzay katmanları (Oort cloud + nearby stars)
     · Jiroskop / cihaz hareketi (device orientation camera)
   Talks to the core via window.__solarSim + bridge events.
============================================================ */
(function () {
const { useState, useEffect, useRef, useCallback, useMemo } = React;

// Shared monoline icon set (same registry the core UI uses).
function Icon({ name, size = 16, stroke = 1.6, style }) {
  const inner = (window.__ICONS && window.__ICONS[name]) || '';
  return React.createElement('svg', {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round',
    style: { display: 'block', flexShrink: 0, ...(style || {}) },
    dangerouslySetInnerHTML: { __html: inner },
  });
}

/* ─────────────────────────────────────────────────────────
   STYLES
───────────────────────────────────────────────────────── */
const css = `
#addons-root { position: fixed; inset: 0; z-index: 14; pointer-events: none; }
#addons-root > * { pointer-events: auto; }

/* ── Vertical tool dock ── */
.ax-dock {
  position: fixed;
  left: 284px; top: 50%;
  transform: translateY(-50%);
  display: flex; flex-direction: column; gap: 8px;
  z-index: 14;
}
.ax-dock-btn {
  width: 42px; height: 42px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(6, 14, 30, 0.82);
  border: 1px solid rgba(0,160,220,0.22);
  border-radius: 10px;
  color: var(--text-secondary, #a0c3e6);
  font-size: 18px;
  cursor: pointer;
  backdrop-filter: blur(12px);
  transition: all 0.15s;
  position: relative;
}
.ax-dock-btn:hover { border-color: rgba(0,200,255,0.5); color: var(--cyan, #00CFEA); transform: scale(1.06); }
.ax-dock-btn.on { background: var(--cyan, #00CFEA); color: #030814; border-color: var(--cyan, #00CFEA); box-shadow: 0 0 14px rgba(0,207,234,0.4); }
.ax-dock-btn .ax-tip {
  position: absolute; left: 52px; top: 50%; transform: translateY(-50%);
  background: rgba(4,10,24,0.96); border: 1px solid rgba(0,160,220,0.3);
  color: var(--text-primary, #dcebff); font-family: 'Space Mono', monospace;
  font-size: 10px; letter-spacing: 0.04em; padding: 5px 9px; border-radius: 6px;
  white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity 0.15s;
}
.ax-dock-btn:hover .ax-tip { opacity: 1; }
.ax-dock-sep { height: 1px; background: rgba(0,160,220,0.18); margin: 2px 6px; }

/* ── Generic overlay panel ── */
.ax-backdrop {
  position: fixed; inset: 0; z-index: 250;
  background: radial-gradient(ellipse at center, rgba(2,6,18,0.82), rgba(2,6,18,0.94));
  backdrop-filter: blur(7px);
  display: flex; align-items: center; justify-content: center; padding: 28px;
  animation: axFade 0.25s ease;
}
@keyframes axFade { from { opacity: 0; } to { opacity: 1; } }
.ax-modal {
  width: 100%; max-width: 1080px; max-height: calc(100vh - 56px);
  background: linear-gradient(180deg, rgba(8,16,32,0.98), rgba(4,10,22,0.99));
  border: 1px solid rgba(0,200,255,0.42); border-radius: 16px;
  box-shadow: 0 30px 80px rgba(0,0,0,0.7);
  display: flex; flex-direction: column; overflow: hidden;
  animation: axUp 0.35s cubic-bezier(0.2,0.8,0.2,1);
}
@keyframes axUp { from { transform: translateY(18px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.ax-head {
  padding: 20px 26px; border-bottom: 1px solid rgba(0,160,220,0.18);
  display: flex; align-items: flex-start; justify-content: space-between; gap: 20px;
  background: linear-gradient(180deg, rgba(0,60,110,0.14), transparent);
}
.ax-eyebrow {
  font-family: 'Space Mono', monospace; font-size: 9.5px; font-weight: 700;
  letter-spacing: 0.2em; text-transform: uppercase; color: var(--cyan, #00CFEA);
  display: flex; align-items: center; gap: 9px; margin-bottom: 6px;
}
.ax-eyebrow::before { content:''; width: 6px; height: 6px; border-radius: 50%; background: var(--cyan,#00CFEA); box-shadow: 0 0 8px var(--cyan,#00CFEA); }
.ax-title { font-family: 'Space Mono', monospace; font-size: 25px; font-weight: 700; color: #eaf3ff; line-height: 1.05; }
.ax-sub { font-size: 12.5px; color: #9ec0e0; margin-top: 7px; line-height: 1.5; max-width: 640px; }
.ax-close {
  width: 36px; height: 36px; flex-shrink: 0; background: rgba(0,18,44,0.6);
  border: 1px solid rgba(0,160,220,0.22); border-radius: 8px; color: #a0c3e6;
  font-size: 17px; cursor: pointer; transition: all 0.15s;
}
.ax-close:hover { border-color: #F26B5C; color: #F26B5C; }
.ax-body { overflow-y: auto; padding: 22px 26px 28px; }

/* ── Buttons ── */
.ax-btn {
  font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 700;
  letter-spacing: 0.06em; padding: 9px 15px; border-radius: 8px; cursor: pointer;
  background: rgba(0,18,44,0.6); border: 1px solid rgba(0,160,220,0.25);
  color: #a0c3e6; transition: all 0.15s;
}
.ax-btn:hover { border-color: rgba(0,200,255,0.5); color: var(--cyan,#00CFEA); }
.ax-btn.primary { background: var(--cyan,#00CFEA); color: #030814; border-color: var(--cyan,#00CFEA); }
.ax-btn.primary:hover { color: #030814; filter: brightness(1.08); }
.ax-btn:disabled { opacity: 0.4; cursor: default; }

/* ── Events ── */
.ax-ev-list { display: flex; flex-direction: column; gap: 9px; }
.ax-ev {
  display: grid; grid-template-columns: 86px 1fr auto; gap: 16px; align-items: center;
  background: rgba(0,22,50,0.5); border: 1px solid rgba(0,160,220,0.18);
  border-radius: 10px; padding: 13px 16px; cursor: pointer; transition: all 0.14s; text-align: left;
}
.ax-ev:hover { border-color: rgba(0,200,255,0.45); background: rgba(0,38,78,0.5); }
.ax-ev-date { font-family: 'Space Mono', monospace; font-size: 13px; font-weight: 700; color: var(--amber,#F0B840); }
.ax-ev-date small { display: block; font-size: 9px; color: #6e96c3; font-weight: 400; margin-top: 2px; }
.ax-ev-title { font-family: 'Space Mono', monospace; font-size: 13.5px; font-weight: 700; color: #eaf3ff; }
.ax-ev-desc { font-size: 11.5px; color: #9ec0e0; line-height: 1.5; margin-top: 3px; }
.ax-ev-go { font-family: 'Space Mono', monospace; font-size: 9px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--cyan,#00CFEA); white-space: nowrap; }
.ax-chip-row { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px; }
.ax-chip {
  font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.05em;
  padding: 6px 12px; border-radius: 20px; cursor: pointer; background: rgba(0,50,100,0.4);
  border: 1px solid rgba(0,160,220,0.2); color: #9ec0e0; transition: all 0.14s;
}
.ax-chip:hover { color: var(--cyan,#00CFEA); }
.ax-chip.on { background: var(--cyan,#00CFEA); color: #030814; border-color: var(--cyan,#00CFEA); }

/* ── Scale compare ── */
.ax-scale-controls { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-bottom: 18px; }
.ax-scale-strip {
  position: relative; overflow-x: auto; overflow-y: hidden; padding: 20px 10px 8px;
  border: 1px solid rgba(0,160,220,0.15); border-radius: 12px; background: rgba(0,10,26,0.5);
}
.ax-scale-rail { display: flex; align-items: flex-end; gap: 38px; min-height: 220px; padding: 0 16px; }
.ax-scale-item { display: flex; flex-direction: column; align-items: center; gap: 8px; flex-shrink: 0; }
.ax-scale-ball { border-radius: 50%; box-shadow: inset -6px -6px 18px rgba(0,0,0,0.45), 0 0 18px rgba(0,150,220,0.12); }
.ax-scale-name { font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 700; color: #dcebff; }
.ax-scale-meta { font-family: 'Space Mono', monospace; font-size: 9px; color: #7ea8d0; text-align: center; }
.ax-select {
  font-family: 'Space Mono', monospace; font-size: 11px; padding: 8px 10px; border-radius: 7px;
  background: rgba(0,18,44,0.7); border: 1px solid rgba(0,160,220,0.25); color: #dcebff; outline: none; color-scheme: dark;
}

/* ── Quiz ── */
.ax-quiz-wrap { max-width: 560px; margin: 0 auto; }
.ax-quiz-q { font-size: 20px; font-weight: 600; color: #eaf3ff; line-height: 1.35; margin-bottom: 22px; text-wrap: pretty; }
.ax-quiz-opts { display: flex; flex-direction: column; gap: 10px; }
.ax-quiz-opt {
  font-family: 'Space Mono', monospace; font-size: 13px; text-align: left; padding: 14px 18px;
  border-radius: 10px; cursor: pointer; background: rgba(0,22,50,0.55);
  border: 1px solid rgba(0,160,220,0.2); color: #cfe0f5; transition: all 0.13s;
}
.ax-quiz-opt:hover:not(:disabled) { border-color: rgba(0,200,255,0.5); background: rgba(0,38,78,0.55); }
.ax-quiz-opt.correct { background: rgba(0,200,130,0.18); border-color: rgba(0,200,130,0.6); color: #7af0bd; }
.ax-quiz-opt.wrong { background: rgba(242,107,92,0.16); border-color: rgba(242,107,92,0.6); color: #ffb0a4; }
.ax-quiz-prog { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; font-family: 'Space Mono', monospace; font-size: 11px; color: #7ea8d0; }
.ax-quiz-bar { height: 3px; background: rgba(0,80,140,0.4); border-radius: 2px; overflow: hidden; margin-bottom: 22px; }
.ax-quiz-bar > div { height: 100%; background: var(--cyan,#00CFEA); transition: width 0.3s; }
.ax-quiz-feedback { margin-top: 18px; padding: 14px 16px; border-radius: 10px; background: rgba(0,18,44,0.6); border: 1px solid rgba(0,160,220,0.2); font-size: 12.5px; color: #bcd4ee; line-height: 1.6; }
.ax-quiz-result { text-align: center; padding: 12px; }
.ax-badge { width: 120px; height: 120px; margin: 0 auto 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 54px; box-shadow: 0 0 40px rgba(240,184,64,0.3); }
.ax-stat-row { display: flex; justify-content: center; gap: 28px; margin: 18px 0; }
.ax-stat { text-align: center; }
.ax-stat-v { font-family: 'Space Mono', monospace; font-size: 30px; font-weight: 700; color: var(--cyan,#00CFEA); }
.ax-stat-l { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: #7ea8d0; margin-top: 4px; }
.ax-badge-shelf { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 10px; }
.ax-badge-mini { display: flex; flex-direction: column; align-items: center; gap: 5px; opacity: 0.35; }
.ax-badge-mini.earned { opacity: 1; }
.ax-badge-mini .ico { width: 46px; height: 46px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px; background: rgba(0,22,50,0.7); border: 1px solid rgba(0,160,220,0.25); }
.ax-badge-mini.earned .ico { border-color: var(--amber,#F0B840); box-shadow: 0 0 14px rgba(240,184,64,0.25); }
.ax-badge-mini .lbl { font-family: 'Space Mono', monospace; font-size: 8px; letter-spacing: 0.06em; color: #9ec0e0; text-transform: uppercase; }

/* ── Surface view ── */
.ax-surface { width: 100%; max-width: 1180px; height: calc(100vh - 56px); display: flex; flex-direction: column; }
.ax-surface-canvas { flex: 1; position: relative; border-radius: 16px; overflow: hidden; border: 1px solid rgba(0,200,255,0.3); background: #02050d; min-height: 0; }
.ax-surface-canvas canvas { display: block; width: 100%; height: 100%; }
.ax-surface-info { position: absolute; left: 18px; bottom: 18px; max-width: 360px; background: rgba(4,10,24,0.78); border: 1px solid rgba(0,160,220,0.25); border-radius: 12px; padding: 14px 16px; backdrop-filter: blur(10px); }
.ax-surface-name { font-family: 'Space Mono', monospace; font-size: 19px; font-weight: 700; color: #eaf3ff; }
.ax-surface-desc { font-size: 11.5px; color: #9ec0e0; line-height: 1.55; margin-top: 6px; }
.ax-surface-hint { position: absolute; right: 18px; top: 18px; font-family: 'Space Mono', monospace; font-size: 10px; color: #7ea8d0; background: rgba(4,10,24,0.7); border: 1px solid rgba(0,160,220,0.2); border-radius: 18px; padding: 6px 12px; }
.ax-bodybar { display: flex; gap: 7px; overflow-x: auto; padding: 14px 4px 2px; flex-shrink: 0; }
.ax-bodybar-item { display: flex; flex-direction: column; align-items: center; gap: 5px; cursor: pointer; flex-shrink: 0; padding: 4px; border-radius: 8px; border: 1px solid transparent; }
.ax-bodybar-item.on { border-color: rgba(0,200,255,0.5); background: rgba(0,38,78,0.4); }
.ax-bodybar-dot { width: 30px; height: 30px; border-radius: 50%; }
.ax-bodybar-lbl { font-family: 'Space Mono', monospace; font-size: 8px; color: #9ec0e0; }

/* ── Toggles inside panels ── */
.ax-toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 11px 14px; background: rgba(0,18,44,0.5); border: 1px solid rgba(0,160,220,0.18); border-radius: 9px; cursor: pointer; margin-bottom: 8px; }
.ax-toggle-row:hover { border-color: rgba(0,200,255,0.4); }
.ax-toggle-txt { display: flex; flex-direction: column; gap: 3px; }
.ax-toggle-name { font-family: 'Space Mono', monospace; font-size: 12px; color: #dcebff; }
.ax-toggle-desc { font-size: 10.5px; color: #8fb3d6; line-height: 1.45; }
.ax-sw { width: 36px; height: 19px; border-radius: 10px; background: rgba(0,50,100,0.7); border: 1px solid rgba(0,160,220,0.3); position: relative; flex-shrink: 0; transition: background 0.15s; }
.ax-sw.on { background: var(--cyan,#00CFEA); border-color: var(--cyan,#00CFEA); }
.ax-sw::after { content:''; position: absolute; width: 13px; height: 13px; border-radius: 50%; background: #cfe6ff; top: 2px; left: 2px; transition: transform 0.15s; }
.ax-sw.on::after { transform: translateX(17px); background: #030814; }
.ax-slider { -webkit-appearance: none; width: 140px; height: 3px; background: rgba(0,80,140,0.5); border-radius: 2px; outline: none; }
.ax-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 13px; height: 13px; border-radius: 50%; background: var(--cyan,#00CFEA); cursor: pointer; }

.ax-toast {
  position: fixed; bottom: 84px; left: 50%; transform: translateX(-50%);
  background: rgba(4,10,24,0.95); border: 1px solid rgba(0,200,255,0.4); border-radius: 22px;
  padding: 10px 20px; font-family: 'Space Mono', monospace; font-size: 11px; color: var(--cyan,#00CFEA);
  z-index: 300; animation: axUp 0.3s ease; letter-spacing: 0.04em;
}

/* focus visibility for accessibility */
.ax-dock-btn:focus-visible, .ax-btn:focus-visible, .ax-close:focus-visible, .ax-quiz-opt:focus-visible,
.ax-chip:focus-visible, .ax-ev:focus-visible { outline: 2px solid var(--cyan,#00CFEA); outline-offset: 2px; }

@media (max-width: 900px) {
  .ax-dock { left: 10px; top: auto; bottom: 78px; transform: none; flex-direction: row; flex-wrap: wrap; max-width: calc(100vw - 20px); }
  .ax-dock-btn { width: 40px; height: 40px; }
  .ax-dock-btn .ax-tip { display: none; }
  .ax-modal { max-height: calc(100vh - 24px); }
  .ax-backdrop { padding: 10px; }
  .ax-title { font-size: 20px; }
  .ax-surface { height: calc(100vh - 24px); }
}
`;
const styleEl = document.createElement('style');
styleEl.textContent = css;
document.head.appendChild(styleEl);

/* ─────────────────────────────────────────────────────────
   i18n — DOM TRANSLATION LAYER (EN ⇄ TR)
   Non-invasive: walks rendered text nodes / placeholders in the
   core UI and swaps exact-match strings. Re-applies on React
   re-renders via a MutationObserver. Originals stored to revert.
───────────────────────────────────────────────────────── */
const TR = {
  // brand / toolbar
  'True Scale Observatory': 'Gerçek Ölçek Gözlemevi',
  'Hybrid': 'Karma', 'Real Distance': 'Gerçek Uzaklık', 'Real Size': 'Gerçek Boyut', 'True 1:1': 'Gerçek 1:1',
  'Search bodies...': 'Gök cismi ara...', 'Search bodies…': 'Gök cismi ara…',
  '📚 Library': '📚 Kütüphane', 'Library': 'Kütüphane',
  '📏 Measure': '📏 Ölç', '📏 Measuring…': '📏 Ölçülüyor…', 'Measure': 'Ölç', 'Measuring…': 'Ölçülüyor…',
  '⇄ Compare': '⇄ Karşılaştır', '⇄ Compare ON': '⇄ Karşılaştırma AÇIK', 'Compare': 'Karşılaştır', 'Compare ON': 'Karşılaştırma AÇIK',
  '⊞ Top-Down': '⊞ Kuş Bakışı', 'Top-Down': 'Kuş Bakışı',
  '⟲ Reset': '⟲ Sıfırla', 'Reset': 'Sıfırla', '⟲ Reset View': '⟲ Görünümü Sıfırla',
  '📷 Photo': '📷 Fotoğraf', 'Photo': 'Fotoğraf',
  '▶ Tours ▾': '▶ Turlar ▾', '✕ Stop Tour': '✕ Turu Durdur',
  // left panel headings
  'Scale Mode': 'Ölçek Modu', 'Display': 'Görünüm', 'Layers': 'Katmanlar', 'Physics overlays': 'Fizik Katmanları',
  'Planet Magnification': 'Gezegen Büyütme', 'Bodies': 'Gök Cisimleri', 'Field Notes': 'Saha Notları',
  'science': 'bilim', 'selected body': 'seçili cisim',
  // toggles
  'Orbit paths': 'Yörünge yolları', 'Body labels': 'Cisim etiketleri', 'Asteroid + Kuiper belts': 'Asteroit + Kuiper kuşakları',
  'Starfield': 'Yıldız alanı', 'Dwarf planets': 'Cüce gezegenler', 'Comets + tails': 'Kuyruklu yıldızlar + kuyruklar',
  'Spacecraft': 'Uzay araçları', 'Habitable zone': 'Yaşanabilir bölge', 'Magnetosphere (selected)': 'Manyetosfer (seçili)',
  '◆ Velocity vector': '◆ Hız vektörü', '◆ Radius + area sweep (Kepler II)': '◆ Yarıçap + alan taraması (Kepler II)',
  '◆ Hill sphere': '◆ Hill küresi', '◆ Lagrange points L1–L5': '◆ Lagrange noktaları L1–L5', '◆ Sun–planet barycentre': '◆ Güneş–gezegen ağırlık merkezi',
  'Size ×': 'Boyut ×', 'True relative size': 'Gerçek göreli boyut',
  // right panel
  'No body selected': 'Cisim seçilmedi',
  'Click any planet in the scene or in the sidebar to see live orbital data, light-time, composition and more.':
    'Canlı yörünge verileri, ışık-zamanı, bileşim ve daha fazlası için sahnedeki ya da kenar çubuğundaki bir gezegene tıklayın.',
  'Physical': 'Fiziksel', 'Orbital': 'Yörüngesel', 'Overview': 'Genel Bakış', 'Notable Facts': 'Dikkat Çekici Bilgiler',
  'Notable Moons': 'Önemli Uydular', 'Mission': 'Görev', 'Diameter': 'Çap', 'Mass': 'Kütle', 'Surface Temp': 'Yüzey Sıcaklığı',
  'Composition': 'Bileşim', 'Surface gravity': 'Yüzey çekimi', 'Density': 'Yoğunluk', 'Escape velocity': 'Kaçış hızı',
  'Atmosphere': 'Atmosfer', 'Discovery': 'Keşif', 'Distance · AU': 'Uzaklık · AU', 'Distance · km': 'Uzaklık · km',
  'Light-time from Sun': 'Güneş\'ten ışık-zamanı', 'Orbital velocity': 'Yörünge hızı', 'Orbital period': 'Yörünge süresi',
  'Axial tilt': 'Eksen eğikliği', 'Moons / Rings': 'Uydular / Halkalar',
  'Keplerian Elements': 'Kepler Öğeleri', 'Physics & Theory': 'Fizik ve Teori',
  '⌖ Fly to': '⌖ Git', '⟲ Reset': '⟲ Sıfırla',
  'Orbital elements': 'Yörünge öğeleri', 'Semi-major axis': 'Yarı-büyük eksen', 'Eccentricity': 'Dış merkezlik',
  'Perihelion': 'Günberi', 'Aphelion': 'Günöte', 'Inclination': 'Eğim', 'Direction': 'Yön', 'Comet': 'Kuyruklu Yıldız',
  // body type pills
  'Star': 'Yıldız', 'Planet': 'Gezegen', 'Dwarf Planet': 'Cüce Gezegen',
  // bottom bar
  'Hybrid scale': 'Karma ölçek', 'Real distance': 'Gerçek uzaklık', 'Real size': 'Gerçek boyut',
  // body names
  'Sun': 'Güneş', 'Mercury': 'Merkür', 'Venus': 'Venüs', 'Earth': 'Dünya', 'Mars': 'Mars', 'Jupiter': 'Jüpiter',
  'Saturn': 'Satürn', 'Uranus': 'Uranüs', 'Neptune': 'Neptün', 'Pluto': 'Plüton', 'Moon': 'Ay',
  'Ceres': 'Ceres', 'Eris': 'Eris', 'Makemake': 'Makemake', 'Haumea': 'Haumea',
};
// Build reverse map for safety (avoid double-translating)
const TR_VALUES = new Set(Object.values(TR));

const origStore = new WeakMap();   // textNode -> original string
let langApplying = false;
let observer = null;

function translateNode(node) {
  const raw = node.nodeValue;
  if (!raw) return;
  const key = raw.trim();
  if (!key) return;
  if (TR[key]) {
    if (!origStore.has(node)) origStore.set(node, raw);
    node.nodeValue = raw.replace(key, TR[key]);
  }
}
function walkTranslate(root) {
  if (!root) return;
  // text nodes
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  let n;
  const batch = [];
  while ((n = tw.nextNode())) batch.push(n);
  batch.forEach(translateNode);
  // placeholders
  root.querySelectorAll && root.querySelectorAll('[placeholder]').forEach(el => {
    const ph = el.getAttribute('placeholder');
    if (TR[ph]) { if (!el.__origPh) el.__origPh = ph; el.setAttribute('placeholder', TR[ph]); }
  });
}
function revertAll() {
  document.querySelectorAll('#ui-root, #addons-root').forEach(root => {
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    let n; const batch = [];
    while ((n = tw.nextNode())) batch.push(n);
    batch.forEach(node => { if (origStore.has(node)) { node.nodeValue = origStore.get(node); } });
    root.querySelectorAll('[placeholder]').forEach(el => { if (el.__origPh) { el.setAttribute('placeholder', el.__origPh); } });
  });
}
function setLang(lang) {
  localStorage.setItem('solar_lang', lang);
  document.documentElement.lang = lang;
  if (lang === 'tr') {
    langApplying = true;
    document.querySelectorAll('#ui-root, #addons-root').forEach(walkTranslate);
    langApplying = false;
    if (!observer) {
      observer = new MutationObserver((muts) => {
        if (langApplying) return;
        langApplying = true;
        for (const m of muts) {
          if (m.type === 'childList') m.addedNodes.forEach(an => {
            if (an.nodeType === 3) translateNode(an);
            else if (an.nodeType === 1) walkTranslate(an);
          });
          else if (m.type === 'characterData') translateNode(m.target);
        }
        langApplying = false;
      });
      observer.observe(document.getElementById('ui-root'), { childList: true, subtree: true, characterData: true });
    }
  } else {
    if (observer) { observer.disconnect(); observer = null; }
    revertAll();
  }
}

/* ─────────────────────────────────────────────────────────
   AMBIENT SOUND (Web Audio generative drone)
───────────────────────────────────────────────────────── */
const Sound = {
  ctx: null, master: null, nodes: [], on: false,
  start() {
    if (this.on) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!this.ctx) this.ctx = new Ctx();
    const ctx = this.ctx;
    if (ctx.state === 'suspended') ctx.resume();
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);
    const targetVol = parseFloat(localStorage.getItem('solar_vol') || '0.25');
    // Two detuned low oscillators + a slow filtered noise wash
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.value = 420; filt.Q.value = 0.7;
    filt.connect(this.master);
    [55, 82.4, 110].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i === 2 ? 'triangle' : 'sine';
      o.frequency.value = f;
      o.detune.value = (i - 1) * 6;
      const g = ctx.createGain();
      g.gain.value = i === 2 ? 0.18 : 0.32;
      o.connect(g); g.connect(filt); o.start();
      this.nodes.push(o, g);
      // slow LFO on gain
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.04 + i * 0.017;
      const lg = ctx.createGain(); lg.gain.value = 0.12;
      lfo.connect(lg); lg.connect(g.gain); lfo.start();
      this.nodes.push(lfo, lg);
    });
    // gentle filtered noise (solar wind)
    const bufSize = 2 * ctx.sampleRate;
    const noiseBuf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.4;
    const noise = ctx.createBufferSource(); noise.buffer = noiseBuf; noise.loop = true;
    const nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 220; nf.Q.value = 0.5;
    const ng = ctx.createGain(); ng.gain.value = 0.06;
    noise.connect(nf); nf.connect(ng); ng.connect(this.master); noise.start();
    this.nodes.push(noise, nf, ng);
    this.filt = filt;
    this.master.gain.linearRampToValueAtTime(targetVol, ctx.currentTime + 1.5);
    this.on = true;
  },
  stop() {
    if (!this.on || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.linearRampToValueAtTime(0, t + 0.8);
    const nodes = this.nodes; const master = this.master;
    setTimeout(() => {
      nodes.forEach(n => { try { n.stop && n.stop(); n.disconnect && n.disconnect(); } catch (e) {} });
      try { master.disconnect(); } catch (e) {}
    }, 900);
    this.nodes = []; this.on = false;
  },
  setVol(v) {
    localStorage.setItem('solar_vol', String(v));
    if (this.on && this.master) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.1);
  },
};

/* ─────────────────────────────────────────────────────────
   GYRO / DEVICE ORIENTATION
───────────────────────────────────────────────────────── */
const Gyro = {
  on: false, handler: null, base: null,
  async start() {
    const sim = window.__solarSim; if (!sim) return false;
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try { const p = await DeviceOrientationEvent.requestPermission(); if (p !== 'granted') return false; } catch (e) { return false; }
    }
    this.base = null;
    this.handler = (e) => {
      const sim = window.__solarSim; if (!sim || e.beta == null) return;
      if (!this.base) this.base = { beta: e.beta, gamma: e.gamma };
      const dBeta = (e.beta - this.base.beta) * Math.PI / 180;
      const dGamma = (e.gamma - this.base.gamma) * Math.PI / 180;
      const ctrls = sim.controls; const cam = sim.camera;
      if (!ctrls || !cam) return;
      const target = ctrls.target;
      const off = cam.position.clone().sub(target);
      const radius = off.length();
      let theta = Math.atan2(off.x, off.z) + dGamma * 0.08;
      let phi = Math.acos(Math.max(-1, Math.min(1, off.y / radius))) - dBeta * 0.06;
      phi = Math.max(0.2, Math.min(Math.PI - 0.2, phi));
      off.x = radius * Math.sin(phi) * Math.sin(theta);
      off.y = radius * Math.cos(phi);
      off.z = radius * Math.sin(phi) * Math.cos(theta);
      cam.position.copy(target).add(off);
      cam.lookAt(target);
      this.base = { beta: e.beta, gamma: e.gamma };
    };
    window.addEventListener('deviceorientation', this.handler);
    this.on = true; return true;
  },
  stop() { if (this.handler) window.removeEventListener('deviceorientation', this.handler); this.on = false; this.base = null; },
};

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function hx(hex){ hex=(hex||'#888').replace('#',''); return [parseInt(hex.slice(0,2),16),parseInt(hex.slice(2,4),16),parseInt(hex.slice(4,6),16)]; }
function lighten(hex,a){ const[r,g,b]=hx(hex); return `rgb(${Math.min(255,r+(255-r)*a)|0},${Math.min(255,g+(255-g)*a)|0},${Math.min(255,b+(255-b)*a)|0})`; }
function darken(hex,a){ const[r,g,b]=hx(hex); return `rgb(${r*(1-a)|0},${g*(1-a)|0},${b*(1-a)|0})`; }
function ballBg(c){ return `radial-gradient(circle at 32% 30%, ${lighten(c,0.4)}, ${c} 58%, ${darken(c,0.5)})`; }
const isTR = () => (localStorage.getItem('solar_lang') === 'tr');
function L(en, tr){ return isTR() ? tr : en; }

function allBodies() {
  return [...(window.SOL_DATA||[]), ...(window.DWARF_PLANETS||[])];
}
function trName(b){ return isTR() && TR[b.name] ? TR[b.name] : b.name; }

/* ─────────────────────────────────────────────────────────
   COMPONENT: Modal shell
───────────────────────────────────────────────────────── */
function Modal({ eyebrow, title, sub, onClose, children, wide }) {
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="ax-backdrop" onClick={onClose}>
      <div className="ax-modal" style={wide ? { maxWidth: 1180 } : null} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <div className="ax-head">
          <div>
            <div className="ax-eyebrow">{eyebrow}</div>
            <div className="ax-title">{title}</div>
            {sub && <div className="ax-sub">{sub}</div>}
          </div>
          <button className="ax-close" onClick={onClose} aria-label={L('Close','Kapat')}>✕</button>
        </div>
        <div className="ax-body">{children}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   EVENTS TIME-MACHINE
───────────────────────────────────────────────────────── */
function EventsModal({ onClose, onToast }) {
  const [filter, setFilter] = useState('all');
  const [simDate, setSimDate] = useState(window.__solarSim ? window.__solarSim.getSimDate() : new Date());
  const events = useMemo(() => [...(window.ASTRO_EVENTS||[])].sort((a,b)=>new Date(a.date)-new Date(b.date)), []);
  const cats = [
    { id: 'all', label: L('Tümü','Tümü') },
    { id: 'eclipse', label: L('Eclipses','Tutulmalar') },
    { id: 'conjunction', label: L('Conjunctions','Kavuşumlar') },
    { id: 'opposition', label: L('Oppositions','Karşı konumlar') },
  ];
  const matchCat = (ev) => {
    if (filter === 'all') return true;
    const t = ev.title.toLowerCase();
    if (filter === 'eclipse') return t.includes('eclipse');
    if (filter === 'conjunction') return t.includes('conjunction');
    if (filter === 'opposition') return t.includes('opposition');
    return true;
  };
  const go = (ev) => {
    const sim = window.__solarSim; if (!sim) return;
    sim.setSimDate(new Date(ev.date));
    setSimDate(new Date(ev.date));
    if (ev.body && window.__solarSelectBody) window.__solarSelectBody(ev.body);
    onToast(L('Jumped to ','Tarihe gidildi: ') + ev.date);
  };
  return (
    <Modal
      eyebrow={L('Time Machine','Zaman Makinesi')}
      title={L('Astronomical Events','Gök Olayları')}
      sub={L('Jump the simulation to a real eclipse, conjunction or opposition — the scene re-propagates every orbit to that exact date.',
             'Simülasyonu gerçek bir tutulma, kavuşum ya da karşı konuma atlatın — sahne tüm yörüngeleri o tam tarihe göre yeniden hesaplar.')}
      onClose={onClose}
    >
      <div className="ax-chip-row" role="tablist">
        {cats.map(c => (
          <button key={c.id} className={`ax-chip ${filter===c.id?'on':''}`} onClick={()=>setFilter(c.id)}>{c.label}</button>
        ))}
      </div>
      <div className="ax-ev-list">
        {events.filter(matchCat).map((ev,i) => {
          const days = Math.round((new Date(ev.date) - simDate) / 86400000);
          const rel = days === 0 ? L('now','şimdi') : days > 0 ? `+${days} ${L('d','g')}` : `${days} ${L('d','g')}`;
          return (
            <button className="ax-ev" key={i} onClick={()=>go(ev)}>
              <div className="ax-ev-date">{ev.date.slice(0,4)}<small>{ev.date.slice(5)}</small></div>
              <div>
                <div className="ax-ev-title">{ev.title}</div>
                <div className="ax-ev-desc">{ev.desc}</div>
              </div>
              <div className="ax-ev-go">{rel}<br/>{L('JUMP →','GİT →')}</div>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

/* ─────────────────────────────────────────────────────────
   SCALE COMPARISON
───────────────────────────────────────────────────────── */
function ScaleModal({ onClose }) {
  const bodies = useMemo(() => allBodies().filter(b => b.diameterKm > 0), []);
  const [refId, setRefId] = useState('earth');
  const [logScale, setLogScale] = useState(true);
  const ref = bodies.find(b => b.id === refId) || bodies[0];
  const refPx = 70; // reference rendered diameter
  const px = (d) => {
    const ratio = d / ref.diameterKm;
    if (logScale) {
      // log scale keeps the Sun and Mercury both visible
      const v = refPx * (1 + Math.log10(ratio));
      return Math.max(8, v);
    }
    return Math.max(3, refPx * ratio);
  };
  const sorted = [...bodies].sort((a,b)=>b.diameterKm-a.diameterKm);
  return (
    <Modal
      eyebrow={L('Size Comparison','Boyut Karşılaştırma')}
      title={L('Worlds to Scale','Ölçekli Dünyalar')}
      sub={L('Every body sized relative to a reference world. Switch to true (linear) scale to feel how vast the Sun really is.',
             'Her cisim, seçtiğiniz referans dünyaya göre ölçeklenir. Güneş\'in gerçekte ne kadar büyük olduğunu hissetmek için gerçek (doğrusal) ölçeğe geçin.')}
      onClose={onClose} wide
    >
      <div className="ax-scale-controls">
        <span style={{fontFamily:'Space Mono, monospace',fontSize:11,color:'#9ec0e0'}}>{L('Reference','Referans')}:</span>
        <select className="ax-select" value={refId} onChange={e=>setRefId(e.target.value)}>
          {sorted.map(b => <option key={b.id} value={b.id}>{trName(b)}</option>)}
        </select>
        <button className={`ax-btn ${logScale?'':'primary'}`} onClick={()=>setLogScale(false)}>{L('True scale','Gerçek ölçek')}</button>
        <button className={`ax-btn ${logScale?'primary':''}`} onClick={()=>setLogScale(true)}>{L('Log scale','Log ölçek')}</button>
      </div>
      <div className="ax-scale-strip">
        <div className="ax-scale-rail">
          {sorted.map(b => {
            const d = px(b.diameterKm);
            const ratio = b.diameterKm / ref.diameterKm;
            return (
              <div className="ax-scale-item" key={b.id}>
                <div className="ax-scale-ball" style={{ width: d, height: d, background: ballBg(b.color), border: b.id===refId?'2px solid var(--cyan,#00CFEA)':'none' }}></div>
                <div className="ax-scale-name">{trName(b)}</div>
                <div className="ax-scale-meta">{b.diameterKm.toLocaleString()} km<br/>{ratio>=1?ratio.toFixed(ratio>=10?0:1)+'×':'1/'+(1/ratio).toFixed(ratio>0.1?1:0)} {L('of ref','ref')}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{fontFamily:'Space Mono, monospace',fontSize:10,color:'#7ea8d0',marginTop:12,textAlign:'center'}}>
        {L('Scroll horizontally →  ·  ','Yatay kaydırın →  ·  ')}
        {logScale ? L('Log scale compresses the 109× Sun-to-Earth range','Log ölçek, 109× Güneş–Dünya farkını sıkıştırır') : L('True linear ratios','Gerçek doğrusal oranlar')}
      </div>
    </Modal>
  );
}

/* ─────────────────────────────────────────────────────────
   QUIZ
───────────────────────────────────────────────────────── */
const BADGES = [
  { id: 'first', icon: 'launch', en: 'First Launch', tr: 'İlk Uçuş', test: s => s.played >= 1 },
  { id: 'perfect', icon: 'star4', en: 'Perfect Run', tr: 'Kusursuz Tur', test: s => s.bestPct >= 100 },
  { id: 'streak', icon: 'bolt', en: 'Hot Streak', tr: 'Seri Galip', test: s => s.bestStreak >= 5 },
  { id: 'scholar', icon: 'book', en: 'Scholar', tr: 'Bilgin', test: s => s.totalCorrect >= 25 },
  { id: 'veteran', icon: 'planet', en: 'Veteran', tr: 'Gezgin', test: s => s.played >= 5 },
];
function loadQuizStats(){ try { return JSON.parse(localStorage.getItem('solar_quiz')||'{}'); } catch(e){ return {}; } }
function saveQuizStats(s){ localStorage.setItem('solar_quiz', JSON.stringify(s)); }

function buildQuestions() {
  const planets = (window.SOL_DATA||[]).filter(b => b.type !== 'star');
  const pick = (arr,n)=>{ const c=[...arr]; const out=[]; while(out.length<n&&c.length){ out.push(c.splice(Math.random()*c.length|0,1)[0]); } return out; };
  const shuffle = a => a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(v=>v[1]);
  const qs = [];
  const numericQ = (label_en, label_tr, key, hi=true) => {
    const sorted = [...planets].sort((a,b)=> hi ? b[key]-a[key] : a[key]-b[key]);
    const ans = sorted[0];
    const opts = shuffle([ans, ...pick(planets.filter(p=>p.id!==ans.id),3)]);
    return { q: L(label_en,label_tr), opts: opts.map(trName), correct: trName(ans), fact: (isTR()?'':'')+ans.name+': '+ans.shortDescription };
  };
  qs.push(numericQ('Which planet is largest?','Hangi gezegen en büyüktür?','diameterKm',true));
  qs.push(numericQ('Which planet is closest to the Sun?','Hangi gezegen Güneş\'e en yakındır?','distanceAU',false));
  qs.push(numericQ('Which planet has the hottest surface?','Hangi gezegenin yüzeyi en sıcaktır?','surfaceTempC',true));
  qs.push(numericQ('Which planet has the most moons?','Hangi gezegenin en çok uydusu vardır?','moons',true));
  qs.push(numericQ('Which planet has the strongest surface gravity?','Hangi gezegenin yüzey çekimi en güçlüdür?','gravityMS2',true));
  qs.push(numericQ('Which planet orbits the Sun fastest (shortest year)?','Hangi gezegen Güneş çevresinde en hızlı döner (en kısa yıl)?','orbitalPeriodDays',false));
  qs.push(numericQ('Which planet is the densest?','Hangi gezegen en yoğundur?','densityGcc',true));
  // ring question
  const ringed = planets.filter(p=>p.hasRings);
  if (ringed.length) {
    const ans = pick(ringed,1)[0];
    const opts = shuffle([ans, ...pick(planets.filter(p=>!p.hasRings),3)]);
    qs.push({ q: L('Which of these has a ring system?','Bunlardan hangisinin halka sistemi vardır?'), opts: opts.map(trName), correct: trName(ans), fact: ans.name+' · '+ans.shortDescription });
  }
  return shuffle(qs).slice(0,7);
}

function QuizModal({ onClose, onToast }) {
  const [questions] = useState(buildQuestions);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [done, setDone] = useState(false);
  const [stats, setStats] = useState(loadQuizStats);
  const q = questions[idx];

  const choose = (opt) => {
    if (picked) return;
    setPicked(opt);
    if (opt === q.correct) { setScore(s=>s+1); setStreak(st=>{ const n=st+1; setBestStreak(b=>Math.max(b,n)); return n; }); }
    else setStreak(0);
  };
  const next = () => {
    if (idx+1 >= questions.length) {
      const pct = Math.round((score)/questions.length*100);
      const newStats = {
        played: (stats.played||0)+1,
        totalCorrect: (stats.totalCorrect||0)+score,
        bestPct: Math.max(stats.bestPct||0, pct),
        bestStreak: Math.max(stats.bestStreak||0, bestStreak),
      };
      saveQuizStats(newStats); setStats(newStats); setDone(true);
    } else { setIdx(i=>i+1); setPicked(null); }
  };
  const restart = () => { /* reshuffle by remount */ onClose(); setTimeout(()=>window.dispatchEvent(new CustomEvent('ax-open-quiz')), 60); };

  if (done) {
    const pct = Math.round(score/questions.length*100);
    const earned = BADGES.filter(b => b.test(stats));
    const medalName = pct >= 40 ? 'medal' : 'moon';
    const medalColor = pct>=100?'#F0B840':pct>=70?'#C8D2E0':pct>=40?'#C77B4A':'#7AC8FF';
    return (
      <Modal eyebrow={L('Result','Sonuç')} title={L('Mission Debrief','Görev Değerlendirme')} onClose={onClose}>
        <div className="ax-quiz-result">
          <div className="ax-badge" style={{background:'radial-gradient(circle at 40% 35%, rgba(240,184,64,0.18), rgba(0,18,44,0.6))', color: medalColor}}><Icon name={medalName} size={58} stroke={1.4} /></div>
          <div style={{fontFamily:'Space Mono, monospace',fontSize:18,fontWeight:700,color:'#eaf3ff'}}>
            {pct>=100?L('Flawless!','Kusursuz!'):pct>=70?L('Well done!','Aferin!'):pct>=40?L('Keep exploring','Keşfetmeye devam'):L('Try again','Tekrar dene')}
          </div>
          <div className="ax-stat-row">
            <div className="ax-stat"><div className="ax-stat-v">{score}/{questions.length}</div><div className="ax-stat-l">{L('Score','Puan')}</div></div>
            <div className="ax-stat"><div className="ax-stat-v">{pct}%</div><div className="ax-stat-l">{L('Accuracy','İsabet')}</div></div>
            <div className="ax-stat"><div className="ax-stat-v">{bestStreak}</div><div className="ax-stat-l">{L('Best streak','En iyi seri')}</div></div>
          </div>
          <div style={{fontFamily:'Space Mono, monospace',fontSize:10,letterSpacing:'0.12em',textTransform:'uppercase',color:'#7ea8d0',marginTop:8,marginBottom:6}}>{L('Badges','Rozetler')}</div>
          <div className="ax-badge-shelf">
            {BADGES.map(b => (
              <div key={b.id} className={`ax-badge-mini ${earned.find(e=>e.id===b.id)?'earned':''}`}>
                <div className="ico"><Icon name={b.icon} size={22} /></div>
                <div className="lbl">{isTR()?b.tr:b.en}</div>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:10,justifyContent:'center',marginTop:24}}>
            <button className="ax-btn primary" onClick={restart}>{L('Play again','Tekrar oyna')}</button>
            <button className="ax-btn" onClick={onClose}>{L('Close','Kapat')}</button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal eyebrow={L('Learning Mode','Öğrenme Modu')} title={L('Solar System Quiz','Güneş Sistemi Sınavı')} onClose={onClose}>
      <div className="ax-quiz-wrap">
        <div className="ax-quiz-prog">
          <span>{L('Question','Soru')} {idx+1} / {questions.length}</span>
          <span style={{display:'inline-flex',alignItems:'center'}}>{L('Score','Puan')}: {score}{streak>=2 ? <span style={{display:'inline-flex',alignItems:'center',gap:3,color:'var(--amber,#F0B840)',marginLeft:7}}><Icon name="bolt" size={12} />{streak}</span> : null}</span>
        </div>
        <div className="ax-quiz-bar"><div style={{width: ((idx+(picked?1:0))/questions.length*100)+'%'}}></div></div>
        <div className="ax-quiz-q">{q.q}</div>
        <div className="ax-quiz-opts">
          {q.opts.map(opt => {
            let cls = 'ax-quiz-opt';
            if (picked) { if (opt===q.correct) cls+=' correct'; else if (opt===picked) cls+=' wrong'; }
            return <button key={opt} className={cls} disabled={!!picked} onClick={()=>choose(opt)}>{opt}</button>;
          })}
        </div>
        {picked && (
          <>
            <div className="ax-quiz-feedback">
              {picked===q.correct ? '✓ '+L('Correct! ','Doğru! ') : '✗ '+L('Not quite. ','Tam değil. ')}
              {q.fact}
            </div>
            <div style={{textAlign:'right',marginTop:16}}>
              <button className="ax-btn primary" onClick={next}>{idx+1>=questions.length?L('Finish','Bitir'):L('Next →','Sonraki →')}</button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

/* ─────────────────────────────────────────────────────────
   SURFACE EXPLORER (mini THREE scene)
───────────────────────────────────────────────────────── */
function SurfaceModal({ initialId, onClose }) {
  const mountRef = useRef(null);
  const [bodyId, setBodyId] = useState(initialId || 'earth');
  const stateRef = useRef({});
  const bodies = useMemo(() => allBodies(), []);
  const body = bodies.find(b => b.id === bodyId) || bodies[0];

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !window.THREE) return;
    const THREE = window.THREE;
    const w = mount.clientWidth, h = mount.clientHeight;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    if ('outputColorSpace' in renderer && 'SRGBColorSpace' in THREE) renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w/h, 0.01, 100);
    camera.position.set(0, 0, 3.0);
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.08;
    controls.enablePan = false; controls.minDistance = 1.6; controls.maxDistance = 7;
    controls.autoRotate = true; controls.autoRotateSpeed = 0.6;
    scene.add(new THREE.AmbientLight(0x556680, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(5,2,4); scene.add(key);
    const rim = new THREE.DirectionalLight(0x4070b0, 0.5); rim.position.set(-4,-1,-3); scene.add(rim);
    // starfield backdrop
    const sGeo = new THREE.BufferGeometry(); const sp = new Float32Array(1200*3);
    for (let i=0;i<1200;i++){ const th=Math.random()*Math.PI*2, ph=Math.acos(Math.random()*2-1), r=40; sp[i*3]=r*Math.sin(ph)*Math.cos(th); sp[i*3+1]=r*Math.cos(ph); sp[i*3+2]=r*Math.sin(ph)*Math.sin(th); }
    sGeo.setAttribute('position', new THREE.BufferAttribute(sp,3));
    scene.add(new THREE.Points(sGeo, new THREE.PointsMaterial({ size: 0.12, color: 0xaaccff, sizeAttenuation: true, transparent:true, opacity:0.7 })));
    stateRef.current = { renderer, scene, camera, controls, mount, mesh: null, THREE };

    let raf;
    const loop = () => { controls.update(); if (stateRef.current.mesh) stateRef.current.mesh.rotation.y += 0.0; renderer.render(scene, camera); raf = requestAnimationFrame(loop); };
    loop();
    const onR = () => { const w2=mount.clientWidth,h2=mount.clientHeight; renderer.setSize(w2,h2); camera.aspect=w2/h2; camera.updateProjectionMatrix(); };
    window.addEventListener('resize', onR);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onR); controls.dispose(); renderer.dispose(); try{ mount.removeChild(renderer.domElement); }catch(e){} };
  }, []);

  // (re)build the sphere when body changes
  useEffect(() => {
    const st = stateRef.current; if (!st.scene) return;
    const THREE = st.THREE;
    if (st.mesh) { st.scene.remove(st.mesh); st.mesh.geometry.dispose(); st.mesh.material.map && st.mesh.material.map.dispose(); st.mesh.material.dispose(); st.mesh = null; }
    let canvas = null;
    try { canvas = window.generateTexture(bodyId, 1024); } catch(e) {}
    if (!canvas) { try { canvas = window.generateTexture('mercury', 1024); } catch(e){} }
    const geo = new THREE.SphereGeometry(1, 96, 64);
    let mat;
    if (canvas) {
      const tex = new THREE.CanvasTexture(canvas);
      if ('SRGBColorSpace' in THREE) tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      mat = body.type==='star'
        ? new THREE.MeshBasicMaterial({ map: tex })
        : new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92, metalness: 0.0 });
    } else {
      mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(body.color), roughness: 0.9 });
    }
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.z = THREE.MathUtils.degToRad(body.axialTiltDeg||0);
    st.scene.add(mesh); st.mesh = mesh;
  }, [bodyId, body]);

  return (
    <div className="ax-backdrop" onClick={onClose}>
      <div className="ax-surface" onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
          <div>
            <div className="ax-eyebrow">{L('Surface Explorer','Yüzey Kâşifi')}</div>
            <div className="ax-title" style={{fontSize:22}}>{trName(body)}</div>
          </div>
          <button className="ax-close" onClick={onClose} aria-label={L('Close','Kapat')}>✕</button>
        </div>
        <div className="ax-surface-canvas" ref={mountRef}>
          <div className="ax-surface-hint">{L('Drag to rotate · scroll to zoom','Döndürmek için sürükle · yakınlaştırmak için kaydır')}</div>
          <div className="ax-surface-info">
            <div className="ax-surface-name">{trName(body)}</div>
            <div className="ax-surface-desc">{body.shortDescription}</div>
          </div>
        </div>
        <div className="ax-bodybar">
          {bodies.map(b => (
            <div key={b.id} className={`ax-bodybar-item ${b.id===bodyId?'on':''}`} onClick={()=>setBodyId(b.id)} title={trName(b)}>
              <div className="ax-bodybar-dot" style={{background: ballBg(b.color)}}></div>
              <div className="ax-bodybar-lbl">{trName(b)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   LAYERS PANEL (deep-space + sound + gyro)
───────────────────────────────────────────────────────── */
function LayersModal({ onClose, layers, setLayers, onToast }) {
  const set = (k, v) => {
    setLayers(prev => ({ ...prev, [k]: v }));
    const sim = window.__solarSim;
    if (k === 'oort' && sim && sim.setShowOort) sim.setShowOort(v);
    if (k === 'stars' && sim && sim.setShowNearbyStars) sim.setShowNearbyStars(v);
    if (k === 'sound') { v ? Sound.start() : Sound.stop(); }
    if (k === 'gyro') {
      if (v) Gyro.start().then(ok => { if (!ok) { onToast(L('Gyro unavailable on this device','Bu cihazda jiroskop yok')); setLayers(p=>({...p,gyro:false})); } else onToast(L('Gyro active — tilt your device','Jiroskop aktif — cihazı eğin')); });
      else Gyro.stop();
    }
  };
  const Row = ({ k, icon, name, desc, extra }) => (
    <div className="ax-toggle-row" onClick={()=>set(k, !layers[k])} role="switch" aria-checked={!!layers[k]} tabIndex={0}
         onKeyDown={e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); set(k,!layers[k]); } }}>
      <div className="ax-toggle-txt">
        <div className="ax-toggle-name" style={{display:'flex',alignItems:'center',gap:8}}><Icon name={icon} size={15} /><span>{name}</span></div>
        <div className="ax-toggle-desc">{desc}</div>
        {extra}
      </div>
      <div className={`ax-sw ${layers[k]?'on':''}`}></div>
    </div>
  );
  return (
    <Modal
      eyebrow={L('Deep Space & Senses','Derin Uzay ve Duyular')}
      title={L('Layers & Atmosphere','Katmanlar ve Atmosfer')}
      sub={L('Reveal the outer edges of the system and add an immersive layer of sound and motion.',
             'Sistemin dış sınırlarını ortaya çıkarın; sürükleyici ses ve hareket katmanı ekleyin.')}
      onClose={onClose}
    >
      <div style={{maxWidth:560,margin:'0 auto'}}>
        <div style={{fontFamily:'Space Mono, monospace',fontSize:10,letterSpacing:'0.14em',textTransform:'uppercase',color:'var(--cyan,#00CFEA)',margin:'4px 0 10px'}}>{L('More bodies','Daha fazla cisim')}</div>
        <Row k="oort" icon="comet" name={L('Oort Cloud','Oort Bulutu')} desc={L('The vast spherical shell of comets enclosing the system (~2,000–100,000 AU).','Sistemi saran devasa küresel kuyruklu yıldız kabuğu (~2.000–100.000 AU).')} />
        <Row k="stars" icon="star4" name={L('Nearest Stars','En Yakın Yıldızlar')} desc={L('Labelled markers for the 7 closest stars — Proxima, Sirius, Barnard\'s and more.','En yakın 7 yıldız için etiketli işaretler — Proxima, Sirius, Barnard ve daha fazlası.')} />
        <div style={{fontFamily:'Space Mono, monospace',fontSize:10,letterSpacing:'0.14em',textTransform:'uppercase',color:'var(--cyan,#00CFEA)',margin:'18px 0 10px'}}>{L('Immersion','Atmosfer')}</div>
        <Row k="sound" icon="speaker" name={L('Ambient Sound','Ortam Sesi')} desc={L('A soft generative deep-space drone.','Yumuşak, üretilen bir derin uzay uğultusu.')}
          extra={layers.sound ? (
            <div style={{marginTop:8}} onClick={e=>e.stopPropagation()}>
              <input className="ax-slider" type="range" min="0" max="0.6" step="0.02" defaultValue={localStorage.getItem('solar_vol')||'0.25'} onChange={e=>Sound.setVol(parseFloat(e.target.value))} aria-label={L('Volume','Ses düzeyi')} />
            </div>
          ) : null}
        />
        <Row k="gyro" icon="device" name={L('Gyroscope / Motion','Jiroskop / Hareket')} desc={L('Tilt your phone to look around (mobile only).','Etrafa bakmak için telefonunuzu eğin (yalnızca mobil).')} />
      </div>
    </Modal>
  );
}

/* ─────────────────────────────────────────────────────────
   ROOT APP — dock + active overlay
───────────────────────────────────────────────────────── */
function AddonsApp() {
  const [view, setView] = useState(null);   // null | events | scale | quiz | surface | layers
  const [lang, setLangState] = useState(localStorage.getItem('solar_lang') || 'en');
  const [toast, setToast] = useState(null);
  const [selId, setSelId] = useState(window.__solarSelectedId || null);
  const [layers, setLayers] = useState({ oort:false, stars:false, sound:false, gyro:false });

  useEffect(() => {
    const onSel = (e) => setSelId(e.detail);
    window.addEventListener('solar-selection', onSel);
    const onQuiz = () => setView('quiz');
    window.addEventListener('ax-open-quiz', onQuiz);
    return () => { window.removeEventListener('solar-selection', onSel); window.removeEventListener('ax-open-quiz', onQuiz); };
  }, []);

  // apply persisted language on mount (after core UI exists)
  useEffect(() => { if (lang === 'tr') setLang('tr'); }, []);

  const showToast = useCallback((msg) => { setToast(msg); setTimeout(()=>setToast(t=>t===msg?null:t), 2600); }, []);

  const toggleLang = () => {
    const nl = lang === 'tr' ? 'en' : 'tr';
    setLang(nl); setLangState(nl);
    showToast(nl==='tr'?'Dil: Türkçe':'Language: English');
  };

  const tools = [
    { id: 'lang', icon: lang==='tr'?'TR':'EN', label: L('Language · Dil','Dil · Language'), onClick: toggleLang, text: true },
    { sep: true },
    { id: 'events', icon: 'clock', label: L('Time Machine','Zaman Makinesi'), onClick: ()=>setView('events') },
    { id: 'scale', icon: 'balance', label: L('Size Comparison','Boyut Karşılaştırma'), onClick: ()=>setView('scale') },
    { id: 'surface', icon: 'planet', label: L('Surface Explorer','Yüzey Kâşifi'), onClick: ()=>setView('surface') },
    { id: 'quiz', icon: 'quiz', label: L('Quiz','Sınav'), onClick: ()=>setView('quiz') },
    { sep: true },
    { id: 'layers', icon: 'orbits', label: L('Layers & Sound','Katmanlar ve Ses'), onClick: ()=>setView('layers'), on: layers.oort||layers.stars||layers.sound||layers.gyro },
  ];

  return (
    <>
      <div className="ax-dock" role="toolbar" aria-label={L('Extra tools','Ek araçlar')}>
        {tools.map((t,i) => t.sep
          ? <div className="ax-dock-sep" key={'s'+i}></div>
          : <button key={t.id} className={`ax-dock-btn ${t.on?'on':''} ${t.id==='lang'?'':''}`} onClick={t.onClick} aria-label={t.label}
                    style={t.text?{fontFamily:'Space Mono, monospace',fontSize:13,fontWeight:700,letterSpacing:'0.04em'}:null}>
              {t.text ? t.icon : <Icon name={t.icon} size={19} />}<span className="ax-tip">{t.label}</span>
            </button>
        )}
      </div>

      {view==='events'  && <EventsModal onClose={()=>setView(null)} onToast={showToast} />}
      {view==='scale'   && <ScaleModal onClose={()=>setView(null)} />}
      {view==='quiz'    && <QuizModal onClose={()=>setView(null)} onToast={showToast} />}
      {view==='surface' && <SurfaceModal initialId={selId} onClose={()=>setView(null)} />}
      {view==='layers'  && <LayersModal onClose={()=>setView(null)} layers={layers} setLayers={setLayers} onToast={showToast} />}

      {toast && <div className="ax-toast">{toast}</div>}
    </>
  );
}

/* ─────────────────────────────────────────────────────────
   MOUNT
───────────────────────────────────────────────────────── */
function mount() {
  const el = document.getElementById('addons-root');
  if (!el || !window.SOL_DATA) { setTimeout(mount, 80); return; }
  ReactDOM.createRoot(el).render(<AddonsApp />);
}
mount();

})();
