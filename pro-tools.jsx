/* ============================================================
   SOLAR 3D · PRO TOOLS  (React, own root #protools-root)
   A self-contained professional toolset that never touches the core
   React tree. Adds an instrument dock with:
     · Grand Tour   — cinematic narrated fly-through (#8)
     · Sky Tonight  — geolocation alt/az ephemeris (#9)
     · Observation Report — print / PDF body dossier (#10)
     · NEO Watch    — near-Earth close-approach alerts (#7)
     · Deep-sky toggles — bright-star catalogue (#4) + probe trails (#5)
   Localised through the same L()/isTR() convention as the add-ons.
   ============================================================ */
(function () {
  const { useState, useEffect, useRef, useMemo, useCallback } = React;
  const isTR = () => (localStorage.getItem('solar_lang') === 'tr');
  const L = (en, tr) => (isTR() ? tr : en);
  const sim = () => window.__solarSim;

  const DEG = Math.PI / 180, RAD = 180 / Math.PI, OBLIQ = 23.4393 * DEG;

  /* ─── astronomy helpers ─── */
  function julian(date) { return date.getTime() / 86400000 + 2440587.5; }
  function gmstDeg(date) {
    const JD = julian(date), D = JD - 2451545.0, T = D / 36525;
    let g = 280.46061837 + 360.98564736629 * D + 0.000387933 * T * T - T * T * T / 38710000;
    g = ((g % 360) + 360) % 360; return g;
  }
  // geocentric RA/Dec (deg) of a planet at date, from heliocentric ephemeris
  function raDec(id, date) {
    const OM = window.OrbitalMechanics;
    if (!OM) return null;
    const bp = id === 'sun' ? { x: 0, y: 0, z: 0 } : OM.planetHeliocentricAU(id, date);
    const ep = OM.planetHeliocentricAU('earth', date);
    if (!bp || !ep) return null;
    // geocentric scene vector (Y-up = ecliptic north)
    const gx = bp.x - ep.x, gy = bp.y - ep.y, gz = bp.z - ep.z;
    const dist = Math.hypot(gx, gy, gz);
    // scene → ecliptic cartesian (Z_ecl = ecliptic north)
    const xe = gx, ye = -gz, ze = gy;
    // ecliptic → equatorial (rotate about X by obliquity)
    const xq = xe;
    const yq = ye * Math.cos(OBLIQ) - ze * Math.sin(OBLIQ);
    const zq = ye * Math.sin(OBLIQ) + ze * Math.cos(OBLIQ);
    let ra = Math.atan2(yq, xq) * RAD; if (ra < 0) ra += 360;
    const dec = Math.asin(Math.max(-1, Math.min(1, zq / (Math.hypot(xq, yq, zq) || 1)))) * RAD;
    return { ra, dec, dist };
  }
  function altAz(id, date, latDeg, lonDeg) {
    const rd = raDec(id, date); if (!rd) return null;
    const lst = (gmstDeg(date) + lonDeg + 360) % 360;
    const H = ((lst - rd.ra + 360) % 360) * DEG;
    const lat = latDeg * DEG, dec = rd.dec * DEG;
    const alt = Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(H));
    let az = Math.atan2(-Math.cos(dec) * Math.sin(H), Math.sin(dec) * Math.cos(lat) - Math.cos(dec) * Math.cos(H) * Math.sin(lat));
    az = (az * RAD + 360) % 360;
    return { alt: alt * RAD, az, ra: rd.ra, dec: rd.dec, dist: rd.dist };
  }
  function raStr(ra) { const h = ra / 15; const hh = Math.floor(h); const mm = Math.floor((h - hh) * 60); const ss = Math.round((((h - hh) * 60) - mm) * 60); return `${hh}h ${String(mm).padStart(2,'0')}m ${String(ss).padStart(2,'0')}s`; }
  function decStr(dec) { const s = dec < 0 ? '\u2212' : '+'; const a = Math.abs(dec); const d = Math.floor(a); const m = Math.round((a - d) * 60); return `${s}${d}\u00B0 ${String(m).padStart(2,'0')}'`; }
  function compass(az) { const names = isTR() ? ['K','KKD','KD','DKD','D','DGD','GD','GGD','G','GGB','GB','BGB','B','BKB','KB','KKB'] : ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']; return names[Math.round(az / 22.5) % 16]; }

  /* ─── shared modal shell (mirrors add-on styling) ─── */
  function Modal({ eyebrow, title, sub, onClose, children, wide }) {
    useEffect(() => { const k = e => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
    return (
      <div className="ax-backdrop" onClick={onClose}>
        <div className="ax-modal" style={wide ? { maxWidth: 960 } : null} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
          <div className="ax-head">
            <div>
              <div className="ax-eyebrow">{eyebrow}</div>
              <div className="ax-title">{title}</div>
              {sub && <div className="ax-sub">{sub}</div>}
            </div>
            <button className="ax-close" onClick={onClose} aria-label={L('Close', 'Kapat')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 5l14 14M19 5L5 19"/></svg>
            </button>
          </div>
          <div className="ax-body">{children}</div>
        </div>
      </div>
    );
  }

  function allBodies() { return [...(window.SOL_DATA || []), ...(window.DWARF_PLANETS || [])]; }
  function trName(b) { const TR = window.TR || {}; return isTR() && TR[b.name] ? TR[b.name] : b.name; }

  /* ════════════════════════════════════════════════════════════
     GRAND TOUR — cinematic narrated fly-through (#8)
     ════════════════════════════════════════════════════════════ */
  function useGrandTour(onToast) {
    const [running, setRunning] = useState(false);
    const [step, setStep] = useState(0);
    const timer = useRef(null);
    const script = window.GRAND_TOUR || [];

    // Chrome elements we dim during a cinematic run. Driven from JS (inline
    // !important) so it reliably wins the cascade regardless of stylesheet
    // @media rules competing on these same nodes.
    const CHROME = ['#toolbar', '#left-panel', '#right-panel', '.telemetry', '.pro-dock', '.ax-dock', '#minimap', '.minimap', '.right-toggle', '.scale-bar', '#scale-bar'];
    const anims = useRef([]);
    const setChrome = (dim) => {
      // cancel any in-flight fades
      anims.current.forEach(a => { try { a.cancel(); } catch (e) {} });
      anims.current = [];
      const els = [];
      CHROME.forEach(sel => document.querySelectorAll(sel).forEach(el => els.push(el)));
      els.forEach(el => {
        el.style.pointerEvents = dim ? 'none' : '';
        if (el.animate) {
          const a = el.animate(
            [{ opacity: getComputedStyle(el).opacity }, { opacity: dim ? 0 : 1 }],
            { duration: 750, easing: 'ease', fill: 'forwards' }
          );
          anims.current.push(a);
        } else {
          el.style.opacity = dim ? '0' : '';
        }
      });
      if (!dim) {
        // after restoring, drop the forwards-fill so the UI returns to normal cascade
        setTimeout(() => { anims.current.forEach(a => { try { a.cancel(); } catch (e) {} }); anims.current = []; }, 800);
      }
    };

    const stop = useCallback(() => {
      setRunning(false); setStep(0);
      if (timer.current) { clearTimeout(timer.current); timer.current = null; }
      const s = sim(); if (s) { try { s.resetView(); } catch (e) {} }
      document.body.classList.remove('pro-cinema');
      setChrome(false);
    }, []);

    const run = useCallback((i) => {
      const s = sim(); if (!s || i >= script.length) { stop(); onToast && onToast(L('Tour complete', 'Tur tamamland\u0131')); return; }
      const st = script[i]; setStep(i);
      try { if (window.__solarSelectBody) window.__solarSelectBody(st.body); else s.flyTo(st.body, { duration: 2200 }); } catch (e) {}
      timer.current = setTimeout(() => run(i + 1), st.dwell || 6000);
    }, [script, stop, onToast]);

    const start = useCallback(() => {
      const s = sim(); if (!s) return;
      setRunning(true);
      document.body.classList.add('pro-cinema');
      setChrome(true);
      run(0);
    }, [run]);

    useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
    return { running, step, script, start, stop };
  }

  function CinemaOverlay({ tour }) {
    if (!tour.running) return null;
    const st = tour.script[tour.step] || {};
    return (
      <div className="pro-cinema-bar">
        <div className="pro-cinema-inner">
          <div className="pro-cinema-meta">
            <span className="pro-cinema-idx">{String(tour.step + 1).padStart(2, '0')} / {String(tour.script.length).padStart(2, '0')}</span>
            <span className="pro-cinema-title">{st.title}</span>
          </div>
          <div className="pro-cinema-cap">{st.caption}</div>
          <div className="pro-cinema-prog">
            {tour.script.map((_, i) => <span key={i} className={'pro-cinema-tick' + (i <= tour.step ? ' on' : '')}></span>)}
          </div>
        </div>
        <button className="pro-cinema-stop" onClick={tour.stop}>{L('End', 'Bitir')}</button>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════
     SKY TONIGHT — geolocation alt/az ephemeris (#9)
     ════════════════════════════════════════════════════════════ */
  function SkyModal({ onClose }) {
    const [loc, setLoc] = useState(null);
    const [status, setStatus] = useState('idle');
    const [now, setNow] = useState(new Date());
    const [manual, setManual] = useState({ lat: '', lon: '' });

    useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);

    const locate = () => {
      setStatus('locating');
      if (!navigator.geolocation) { setStatus('denied'); return; }
      navigator.geolocation.getCurrentPosition(
        p => { setLoc({ lat: p.coords.latitude, lon: p.coords.longitude, label: L('Your location', 'Konumunuz') }); setStatus('ok'); },
        () => setStatus('denied'),
        { timeout: 8000 }
      );
    };
    const useManual = () => {
      const la = parseFloat(manual.lat), lo = parseFloat(manual.lon);
      if (isFinite(la) && isFinite(lo)) { setLoc({ lat: la, lon: lo, label: L('Manual', 'Manuel') }); setStatus('ok'); }
    };

    const targets = ['sun', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
    const rows = useMemo(() => {
      if (!loc) return [];
      return targets.map(id => {
        const b = (window.SOL_DATA || []).find(x => x.id === id) || { id, name: id, color: '#ccc' };
        const aa = altAz(id, now, loc.lat, loc.lon);
        return { b, aa };
      }).filter(r => r.aa).sort((a, b) => b.aa.alt - a.aa.alt);
    }, [loc, now]);

    return (
      <Modal
        eyebrow={L('Observation Planner', 'G\u00f6zlem Planlay\u0131c\u0131')}
        title={L('Sky Tonight', 'Bu Gece G\u00f6ky\u00fcz\u00fc')}
        sub={L('Live altitude & azimuth of the planets from your location — anything above the horizon is up right now.',
               'Bulundu\u011funuz yerden gezegenlerin canl\u0131 y\u00fckseklik ve azimutu \u2014 ufkun \u00fczerindekiler \u015fu an g\u00f6r\u00fcn\u00fcr.')}
        onClose={onClose} wide
      >
        {!loc ? (
          <div className="pro-sky-locate">
            <button className="ax-btn primary" onClick={locate}>{status === 'locating' ? L('Locating\u2026', 'Konum al\u0131n\u0131yor\u2026') : L('Use my location', 'Konumumu kullan')}</button>
            {status === 'denied' && <div className="pro-note">{L('Location unavailable — enter coordinates manually:', 'Konum al\u0131namad\u0131 \u2014 koordinatlar\u0131 elle girin:')}</div>}
            <div className="pro-manual">
              <input className="ax-input" placeholder={L('Latitude', 'Enlem')} value={manual.lat} onChange={e => setManual(m => ({ ...m, lat: e.target.value }))} />
              <input className="ax-input" placeholder={L('Longitude', 'Boylam')} value={manual.lon} onChange={e => setManual(m => ({ ...m, lon: e.target.value }))} />
              <button className="ax-btn" onClick={useManual}>{L('Set', 'Uygula')}</button>
            </div>
          </div>
        ) : (
          <>
            <div className="pro-sky-head">
              <span className="pro-sky-loc">{loc.lat.toFixed(3)}°, {loc.lon.toFixed(3)}°</span>
              <span className="pro-sky-time">{now.toUTCString().slice(5, 22)} UTC</span>
            </div>
            <div className="pro-sky-grid">
              <div className="pro-sky-row pro-sky-hrow">
                <span>{L('Body', 'Cisim')}</span><span>{L('Altitude', 'Y\u00fckseklik')}</span><span>{L('Azimuth', 'Azimut')}</span><span>RA</span><span>Dec</span>
              </div>
              {rows.map(({ b, aa }) => (
                <div className={'pro-sky-row' + (aa.alt > 0 ? ' up' : '')} key={b.id} onClick={() => { if (window.__solarSelectBody) window.__solarSelectBody(b.id); }}>
                  <span className="pro-sky-name"><span className="pro-dot" style={{ background: b.color }}></span>{trName(b)}</span>
                  <span className="pro-mono">{aa.alt > 0 ? '+' : '−'}{Math.abs(aa.alt).toFixed(1)}°
                    <span className={'pro-pill ' + (aa.alt > 0 ? 'up' : 'down')}>{aa.alt > 0 ? L('UP', 'YUKARI') : L('SET', 'BATIK')}</span></span>
                  <span className="pro-mono">{aa.az.toFixed(0)}° <small>{compass(aa.az)}</small></span>
                  <span className="pro-mono pro-dim">{raStr(aa.ra)}</span>
                  <span className="pro-mono pro-dim">{decStr(aa.dec)}</span>
                </div>
              ))}
            </div>
            <button className="ax-btn" style={{ marginTop: 14 }} onClick={() => { setLoc(null); setStatus('idle'); }}>{L('Change location', 'Konumu de\u011fi\u015ftir')}</button>
          </>
        )}
      </Modal>
    );
  }

  /* ════════════════════════════════════════════════════════════
     NEO WATCH — near-Earth close-approach alerts (#7)
     ════════════════════════════════════════════════════════════ */
  function NeoModal({ onClose }) {
    const neos = (window.NEO_OBJECTS || []).slice().sort((a, b) => new Date(a.date) - new Date(b.date));
    return (
      <Modal
        eyebrow={L('Planetary Defence', 'Gezegen Savunmas\u0131')}
        title={L('Near-Earth Watch', 'Yak\u0131n D\u00fcnya Takibi')}
        sub={L('Tracked asteroids with notable close approaches. Distances in lunar distances (1 LD \u2248 384,400 km).',
               'Dikkat \u00e7ekici yak\u0131n ge\u00e7i\u015fleri olan izlenen asteroitler. Mesafeler ay-uzakl\u0131\u011f\u0131 cinsinden (1 LD \u2248 384.400 km).')}
        onClose={onClose}
      >
        <div className="pro-neo-list">
          {neos.map(n => (
            <div className={'pro-neo' + (n.hazard ? ' hazard' : '')} key={n.id}>
              <div className="pro-neo-top">
                <span className="pro-neo-name">{n.hazard && <span className="pro-neo-flag">{L('PHA', 'TEHL\u0130KE')}</span>}{n.name}</span>
                <span className="pro-neo-date">{n.date}</span>
              </div>
              <div className="pro-neo-stats">
                <span><b>{n.diaM >= 1000 ? (n.diaM / 1000).toFixed(1) + ' km' : n.diaM + ' m'}</b> {L('diameter', '\u00e7ap')}</span>
                <span className={'pro-neo-miss' + (n.missDistLD < 1 ? ' close' : '')}><b>{n.missDistLD.toFixed(2)} LD</b> {L('miss', 'ge\u00e7i\u015f')}</span>
              </div>
              {n.missDistLD < 1 && <div className="pro-neo-bar"><div className="pro-neo-bar-fill" style={{ width: Math.max(6, (1 - n.missDistLD) * 100) + '%' }}></div></div>}
              <div className="pro-neo-note">{n.note}</div>
            </div>
          ))}
        </div>
      </Modal>
    );
  }

  /* ════════════════════════════════════════════════════════════
     OBSERVATION REPORT — print / PDF dossier (#10)
     ════════════════════════════════════════════════════════════ */
  function ReportModal({ onClose, initialId }) {
    const bodies = allBodies();
    const [id, setId] = useState(initialId || 'jupiter');
    const b = bodies.find(x => x.id === id) || bodies[0];
    const now = sim() ? sim().getSimDate() : new Date();
    const aa = (b && b.id !== 'sun') ? raDec(b.id, now) : null;

    const print = () => {
      const w = window.open('', '_blank', 'width=820,height=1000');
      if (!w) return;
      const fmt = (v, u) => v == null ? '\u2014' : (typeof v === 'number' ? v.toLocaleString() : v) + (u ? ' ' + u : '');
      const rows = [
        [L('Diameter', '\u00c7ap'), fmt(b.diameterKm, 'km')],
        [L('Mass', 'K\u00fctle'), b.massKg ? b.massKg.toExponential(3) + ' kg' : '\u2014'],
        [L('Surface gravity', 'Y\u00fczey \u00e7ekimi'), fmt(b.gravityMS2, 'm/s\u00B2')],
        [L('Mean density', 'Ortalama yo\u011funluk'), fmt(b.densityGcc, 'g/cm\u00B3')],
        [L('Escape velocity', 'Ka\u00e7\u0131\u015f h\u0131z\u0131'), fmt(b.escapeVelKmS, 'km/s')],
        [L('Surface temp', 'Y\u00fczey s\u0131cakl\u0131\u011f\u0131'), b.surfaceTempC != null ? b.surfaceTempC + ' \u00B0C' : '\u2014'],
        [L('Distance from Sun', 'G\u00fcne\u015f uzakl\u0131\u011f\u0131'), fmt(b.distanceAU, 'AU')],
        [L('Orbital period', 'Y\u00f6r\u00fcnge periyodu'), b.orbitalPeriodDays ? (b.orbitalPeriodDays / 365.25).toFixed(2) + ' yr' : '\u2014'],
        [L('Rotation period', 'D\u00f6nme periyodu'), b.rotationPeriodHours ? b.rotationPeriodHours.toFixed(1) + ' h' : '\u2014'],
        [L('Axial tilt', 'Eksen e\u011fikli\u011fi'), b.axialTiltDeg != null ? b.axialTiltDeg + '\u00B0' : '\u2014'],
        [L('Moons', 'Uydular'), b.moons != null ? String(b.moons) : '\u2014'],
      ];
      if (aa) { rows.push([L('Right ascension (J2000)', 'Sa\u011f a\u00e7\u0131kl\u0131k (J2000)'), raStr(aa.ra)]); rows.push([L('Declination (J2000)', 'Dik a\u00e7\u0131kl\u0131k (J2000)'), decStr(aa.dec)]); rows.push([L('Distance from Earth', 'D\u00fcnya uzakl\u0131\u011f\u0131'), aa.dist.toFixed(3) + ' AU']); }
      const trN = trName(b);
      const css = `*{margin:0;padding:0;box-sizing:border-box;font-family:'Helvetica Neue',Arial,sans-serif;}
        body{padding:54px 58px;color:#14181f;background:#fff;}
        .hd{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #14181f;padding-bottom:14px;}
        .brand{font:700 13px/1 'Helvetica Neue';letter-spacing:.32em;color:#9a7b3c;}
        .doc{font:600 10px/1;letter-spacing:.26em;color:#8a93a0;text-transform:uppercase;}
        h1{font-size:46px;font-weight:700;letter-spacing:-.01em;margin:26px 0 2px;}
        .sub{color:#6b7480;font-size:13px;letter-spacing:.04em;margin-bottom:26px;}
        table{width:100%;border-collapse:collapse;}
        td{padding:9px 4px;border-bottom:1px solid #e7e9ee;font-size:13px;}
        td.k{color:#8a93a0;letter-spacing:.06em;text-transform:uppercase;font-size:10.5px;width:46%;}
        td.v{text-align:right;font-weight:600;font-variant-numeric:tabular-nums;}
        .desc{margin-top:24px;font-size:13px;line-height:1.7;color:#3a4250;max-width:640px;}
        .ft{margin-top:40px;border-top:1px solid #e7e9ee;padding-top:12px;font-size:9.5px;letter-spacing:.18em;color:#aab0ba;text-transform:uppercase;display:flex;justify-content:space-between;}
        @media print{body{padding:32px 36px;}}`;
      w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${trN} \u2014 ${L('Report','Rapor')}</title><style>${css}</style></head><body>
        <div class="hd"><div class="brand">SOLAR 3D</div><div class="doc">${L('Observation Report','G\u00f6zlem Raporu')} \u00b7 N\u00b0 ${String(bodies.indexOf(b)+1).padStart(3,'0')}</div></div>
        <h1>${trN}</h1><div class="sub">${b.type || ''} \u00b7 ${L('Epoch','Tarih')} ${now.toISOString().slice(0,10)}</div>
        <table>${rows.map(r=>`<tr><td class="k">${r[0]}</td><td class="v">${r[1]}</td></tr>`).join('')}</table>
        ${b.description?`<div class="desc">${b.description}</div>`:''}
        <div class="ft"><span>SOLAR 3D \u00b7 TRUE SCALE OBSERVATORY</span><span>${L('Generated','Olu\u015fturuldu')} ${new Date().toISOString().slice(0,10)}</span></div>
        <script>setTimeout(function(){window.print();},350);<\/script></body></html>`);
      w.document.close();
    };

    return (
      <Modal
        eyebrow={L('Documentation', 'Belgeleme')}
        title={L('Observation Report', 'G\u00f6zlem Raporu')}
        sub={L('Generate a print-ready dossier for any body — opens a clean page you can save as PDF.',
               'Herhangi bir cisim i\u00e7in bask\u0131ya haz\u0131r bir dosya olu\u015fturun \u2014 PDF olarak kaydedebilece\u011finiz temiz bir sayfa a\u00e7\u0131l\u0131r.')}
        onClose={onClose}
      >
        <div className="pro-report">
          <label className="pro-report-pick">
            <span>{L('Subject', 'Konu')}</span>
            <select className="ax-input" value={id} onChange={e => setId(e.target.value)}>
              {bodies.map(x => <option key={x.id} value={x.id}>{trName(x)}</option>)}
            </select>
          </label>
          <div className="pro-report-preview">
            <div className="pro-rp-name">{trName(b)}</div>
            <div className="pro-rp-grid">
              <div><span>{L('Diameter', '\u00c7ap')}</span><b>{b.diameterKm ? b.diameterKm.toLocaleString() + ' km' : '\u2014'}</b></div>
              <div><span>{L('Gravity', '\u00c7ekim')}</span><b>{b.gravityMS2 ? b.gravityMS2.toFixed(2) + ' m/s\u00B2' : '\u2014'}</b></div>
              <div><span>{L('Distance', 'Uzakl\u0131k')}</span><b>{b.distanceAU != null ? b.distanceAU.toFixed(2) + ' AU' : '\u2014'}</b></div>
              {aa && <div><span>RA / Dec</span><b className="pro-mono">{raStr(aa.ra)} · {decStr(aa.dec)}</b></div>}
            </div>
          </div>
          <button className="ax-btn primary pro-report-go" onClick={print}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ marginRight: 7, verticalAlign: '-3px' }}><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M6 14h12v7H6z"/></svg>
            {L('Generate PDF', 'PDF Olu\u015ftur')}
          </button>
        </div>
      </Modal>
    );
  }

  /* ════════════════════════════════════════════════════════════
     ROOT — dock + overlays + deep-sky toggles
     ════════════════════════════════════════════════════════════ */
  function ProApp() {
    const [view, setView] = useState(null);   // null | sky | neo | report
    const [selId, setSelId] = useState(window.__solarSelectedId || null);
    const [stars, setStars] = useState(false);
    const [trails, setTrails] = useState(true);
    const [toast, setToast] = useState(null);
    const [, force] = useState(0);
    const tour = useGrandTour((m) => showToast(m));

    const showToast = useCallback((m) => { setToast(m); setTimeout(() => setToast(t => t === m ? null : t), 2400); }, []);

    useEffect(() => {
      const onSel = e => setSelId(e.detail);
      window.addEventListener('solar-selection', onSel);
      const onLang = () => force(n => n + 1);
      window.addEventListener('solar-lang-changed', onLang);
      return () => { window.removeEventListener('solar-selection', onSel); window.removeEventListener('solar-lang-changed', onLang); };
    }, []);

    // apply default trail state once sim is ready
    useEffect(() => {
      const apply = () => { const s = sim(); if (s && s.setShowSpacecraftTrails) s.setShowSpacecraftTrails(trails); };
      if (sim()) apply(); else window.addEventListener('solar-sim-ready', apply, { once: true });
    }, []);

    const toggleStars = () => { const v = !stars; setStars(v); const s = sim(); if (s && s.setShowBrightStars) s.setShowBrightStars(v); showToast(v ? L('Bright stars on', 'Parlak y\u0131ld\u0131zlar a\u00e7\u0131k') : L('Bright stars off', 'Parlak y\u0131ld\u0131zlar kapal\u0131')); };
    const toggleTrails = () => { const v = !trails; setTrails(v); const s = sim(); if (s && s.setShowSpacecraftTrails) s.setShowSpacecraftTrails(v); showToast(v ? L('Probe trails on', 'Sonda izleri a\u00e7\u0131k') : L('Probe trails off', 'Sonda izleri kapal\u0131')); };

    const Btn = ({ id, onClick, on, label, children }) => (
      <button className={'pro-dock-btn' + (on ? ' on' : '')} onClick={onClick} aria-label={label} title={label}>
        {children}<span className="pro-tip">{label}</span>
      </button>
    );

    return (
      <>
        <div className="pro-dock" role="toolbar" aria-label={L('Pro tools', 'Profesyonel ara\u00e7lar')}>
          <span className="pro-dock-brand">PRO</span>
          <span className="pro-dock-sep"></span>
          <Btn id="tour" label={L('Grand Tour', 'B\u00fcy\u00fck Tur')} on={tour.running} onClick={() => tour.running ? tour.stop() : tour.start()}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><polygon points="6 4 20 12 6 20 6 4"/></svg>
          </Btn>
          <Btn id="sky" label={L('Sky Tonight', 'Bu Gece G\u00f6ky\u00fcz\u00fc')} onClick={() => setView('sky')}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
          </Btn>
          <Btn id="neo" label={L('Near-Earth Watch', 'Yak\u0131n D\u00fcnya Takibi')} onClick={() => setView('neo')}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>
          </Btn>
          <Btn id="report" label={L('Observation Report', 'G\u00f6zlem Raporu')} onClick={() => setView('report')}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M7 3h7l5 5v13H7zM14 3v5h5"/></svg>
          </Btn>
          <span className="pro-dock-sep"></span>
          <Btn id="stars" label={L('Bright stars', 'Parlak y\u0131ld\u0131zlar')} on={stars} onClick={toggleStars}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 3l2 6 6 .3-4.7 3.8 1.7 6L12 16l-5 3.1 1.7-6L4 9.3 10 9z"/></svg>
          </Btn>
          <Btn id="trails" label={L('Probe trails', 'Sonda izleri')} on={trails} onClick={toggleTrails}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 20s5-1 9-5 8-9 9-12"/><circle cx="20" cy="4" r="1.6" fill="currentColor"/><path d="M3 20l3-1-2-2z" fill="currentColor"/></svg>
          </Btn>
        </div>

        <CinemaOverlay tour={tour} />
        {view === 'sky' && <SkyModal onClose={() => setView(null)} />}
        {view === 'neo' && <NeoModal onClose={() => setView(null)} />}
        {view === 'report' && <ReportModal initialId={selId} onClose={() => setView(null)} />}
        {toast && <div className="pro-toast">{toast}</div>}
      </>
    );
  }

  function mount() {
    const el = document.getElementById('protools-root');
    if (!el || !window.React || !window.ReactDOM || !window.SOL_DATA) { setTimeout(mount, 90); return; }
    ReactDOM.createRoot(el).render(<ProApp />);
  }
  mount();
})();
