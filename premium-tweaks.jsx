// ════════════════════════════════════════════════════════════════
// PREMIUM TWEAKS  ·  live design controls for Solar 3D
// Drives the instrument-grade reskin: theme, glow, accent, material.
// Applies everything via CSS custom properties on <html> — zero
// coupling to the simulation; no feature touched.
// ════════════════════════════════════════════════════════════════
(function () {
  const { useEffect } = React;

  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "theme": "Observatory",
    "glow": 16,
    "bloom": 100,
    "lensflare": true,
    "themeAccent": true,
    "accent": "#38B6C9",
    "grain": true,
    "motion": true,
    "distUnit": "AU"
  }/*EDITMODE-END*/;

  const ACCENTS = ['#38B6C9', '#62D9EA', '#C6A267', '#3FB489', '#9B8CFF', '#E08A4C'];

  function applyTweaks(t) {
    const root = document.documentElement;
    root.dataset.ds = (t.theme || 'Observatory').toLowerCase();
    root.dataset.motion = t.motion ? 'on' : 'off';
    window.__distUnit = t.distUnit || 'AU';
    root.style.setProperty('--glow', String((t.glow ?? 50) / 100));
    // cinematic sun bloom + lens flare (premium.js setters)
    var sim = window.__solarSim;
    if (sim) {
      if (sim.setBloom) sim.setBloom((t.bloom ?? 100) / 100);
      if (sim.setLensflare) sim.setLensflare(t.lensflare !== false);
    } else {
      // sim not built yet — retry shortly so first paint still reflects tweaks
      clearTimeout(applyTweaks._t);
      applyTweaks._t = setTimeout(function () { applyTweaks(t); }, 350);
    }
    root.style.setProperty('--grain', t.grain
      ? "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/></svg>\")"
      : 'none');

    const accentProps = ['--cyan', '--accent-bright', '--cyan-dim', '--cyan-deep', '--glass-border-bright'];
    if (t.themeAccent) {
      accentProps.forEach(p => root.style.removeProperty(p));
    } else {
      const a = t.accent || '#38B6C9';
      root.style.setProperty('--cyan', a);
      root.style.setProperty('--accent-bright', `color-mix(in srgb, ${a} 64%, white)`);
      root.style.setProperty('--cyan-dim', `color-mix(in srgb, ${a} 52%, transparent)`);
      root.style.setProperty('--cyan-deep', `color-mix(in srgb, ${a} 72%, black)`);
      root.style.setProperty('--glass-border-bright', `color-mix(in srgb, ${a} 60%, transparent)`);
    }
  }

  // Paint defaults immediately so the first frame is already premium.
  applyTweaks(TWEAK_DEFAULTS);

  function TweaksApp() {
    const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
    useEffect(() => { applyTweaks(t); }, [t]);

    return (
      <TweaksPanel title="Design">
        <TweakSection label="Theme" />
        <TweakRadio
          label="Atmosphere" value={t.theme}
          options={['Observatory', 'Atelier', 'Aurora']}
          onChange={(v) => setTweak('theme', v)}
        />

        <TweakSection label="Light" />
        <TweakSlider
          label="Glow" value={t.glow} min={0} max={100} step={5} unit="%"
          onChange={(v) => setTweak('glow', v)}
        />
        <TweakSlider
          label="Sun bloom" value={t.bloom} min={0} max={200} step={10} unit="%"
          onChange={(v) => setTweak('bloom', v)}
        />
        <TweakToggle
          label="Lens flare" value={t.lensflare}
          onChange={(v) => setTweak('lensflare', v)}
        />
        <TweakToggle
          label="Sensor grain" value={t.grain}
          onChange={(v) => setTweak('grain', v)}
        />

        <TweakSection label="Accent" />
        <TweakToggle
          label="Match theme" value={t.themeAccent}
          onChange={(v) => setTweak('themeAccent', v)}
        />
        {!t.themeAccent && (
          <TweakColor
            label="Custom accent" value={t.accent}
            options={ACCENTS}
            onChange={(v) => setTweak('accent', v)}
          />
        )}

        <TweakSection label="Units" />
        <TweakRadio
          label="Distance" value={t.distUnit}
          options={['AU', 'M km', 'light']}
          onChange={(v) => setTweak('distUnit', v)}
        />

        <TweakSection label="Motion" />
        <TweakToggle
          label="Animations" value={t.motion}
          onChange={(v) => setTweak('motion', v)}
        />
      </TweaksPanel>
    );
  }

  const mount = document.getElementById('tweaks-root');
  if (mount) ReactDOM.createRoot(mount).render(<TweaksApp />);
})();
