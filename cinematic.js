// ============================================================
// SOLAR 3D · CINEMATIC MOTION LAYER
// Turns the instant scale-mode swap into a smoothly eased "morph",
// and gives the scale functions a single, centralised blend point.
//
// HOW IT WORKS
//   Every scale function (scaleDistance3D, scaleDiameter3D, the moon /
//   small-body variants) and OrbitalMechanics.auToSceneVec is a PURE
//   function of `mode`. We wrap each one: while a morph is active we
//   evaluate it for BOTH the outgoing and incoming mode and linearly
//   interpolate the result by an eased 0→1 factor. Because the whole
//   engine (body scales, orbit ellipses, live positions, physics
//   overlays, belts) routes through these same functions, the entire
//   scene morphs coherently with zero engine changes.
//
//   setMode() launches a short rAF loop that drives the eased factor and
//   re-runs applyScale() each frame so orbit geometry re-samples through
//   the blended transform. When it finishes we clear the morph and do one
//   clean applyScale() at the true target mode.
// ============================================================
(function () {
  if (typeof SolarSystem3D === 'undefined') return;
  const OM = window.OrbitalMechanics;
  const proto = SolarSystem3D.prototype;

  // ─── 1. Blend wrappers around the pure scale functions ──────────
  // modeArgIndex = position of the `mode` argument in each signature.
  function wrapScalar(name, modeArgIndex) {
    const orig = window[name];
    if (!orig || orig.__morphWrapped) return;
    const wrapped = function () {
      const m = window.__modeMorph;
      if (m) {
        const aArgs = Array.prototype.slice.call(arguments);
        const bArgs = Array.prototype.slice.call(arguments);
        aArgs[modeArgIndex] = m.from;
        bArgs[modeArgIndex] = m.to;
        const a = orig.apply(this, aArgs);
        const b = orig.apply(this, bArgs);
        return a + (b - a) * m.e;
      }
      return orig.apply(this, arguments);
    };
    wrapped.__morphWrapped = true;
    wrapped.__orig = orig;
    window[name] = wrapped;
  }

  wrapScalar('scaleDistance3D', 1);          // (au, mode)
  wrapScalar('scaleDiameter3D', 2);          // (km, type, mode, magnify)
  wrapScalar('scaleMoonDiameter3D', 3);      // (moonKm, parentKm, parentR, mode, magnify)
  wrapScalar('scaleMoonDistance3D', 3);      // (distKm, parentKm, parentR, mode)
  wrapScalar('scaleSmallBodyDiameter3D', 1); // (km, mode, magnify)

  // auToSceneVec returns a {x,y,z} — blend componentwise.
  if (OM && OM.auToSceneVec && !OM.auToSceneVec.__morphWrapped) {
    const origVec = OM.auToSceneVec;
    const wrappedVec = function (x, y, z, mode) {
      const m = window.__modeMorph;
      if (m) {
        const a = origVec(x, y, z, m.from);
        const b = origVec(x, y, z, m.to);
        return {
          x: a.x + (b.x - a.x) * m.e,
          y: a.y + (b.y - a.y) * m.e,
          z: a.z + (b.z - a.z) * m.e,
        };
      }
      return origVec(x, y, z, mode);
    };
    wrappedVec.__morphWrapped = true;
    wrappedVec.__orig = origVec;
    OM.auToSceneVec = wrappedVec;
  }

  // ─── 2. Eased mode transition ───────────────────────────────────
  const easeInOutCubic = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const origSetMode = proto.setMode;
  proto.setMode = function (mode) {
    const prev = this.state.mode;
    // No change → keep legacy behaviour (a plain applyScale through origSetMode).
    if (prev === mode) {
      origSetMode.call(this, mode);
      return;
    }

    const SCALE = window.SCALE_3D;
    const crossingTrue =
      prev === SCALE.TRUE_SCALE || mode === SCALE.TRUE_SCALE;

    // Commit the logical mode immediately so all downstream reads target it.
    this.state.mode = mode;

    // The camera framing changes drastically across the true-scale boundary;
    // ease it in parallel with the geometry morph so the whole shot feels
    // like one continuous cinematic move.
    if (crossingTrue && this.resetView) this.resetView();

    const dur = 1050;
    const start = performance.now();
    if (this._morphRAF) cancelAnimationFrame(this._morphRAF);
    if (this._morphSafety) clearTimeout(this._morphSafety);

    const settle = () => {
      if (this._morphRAF) { cancelAnimationFrame(this._morphRAF); this._morphRAF = null; }
      if (this._morphSafety) { clearTimeout(this._morphSafety); this._morphSafety = null; }
      window.__modeMorph = null;
      this.applyScale();   // clean settle at the exact target mode
    };

    const step = () => {
      const t = Math.min((performance.now() - start) / dur, 1);
      window.__modeMorph = { from: prev, to: mode, e: easeInOutCubic(t) };
      // Re-run the full scale pass so orbit ellipses + body radii re-sample
      // through the blended transform every frame.
      this.applyScale();
      if (t < 1) {
        this._morphRAF = requestAnimationFrame(step);
      } else {
        settle();
      }
    };
    // Safety net: if rAF is paused (e.g. the tab is backgrounded mid-switch),
    // force the scene to settle on the target mode rather than freeze halfway.
    this._morphSafety = setTimeout(settle, dur + 500);
    step();
  };

  // Expose for diagnostics / the verifier.
  window.__cinematicReady = true;
})();
