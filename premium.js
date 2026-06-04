// ============================================================
// SOLAR 3D · PREMIUM RENDER LAYER
// Patches SolarSystem3D.prototype with cinematic touches that are
// reliable across the extreme multi-scale range:
//   • Subtle lens flare on the Sun
//   • Enhanced layered solar corona (bloom-like halo, no post-FX)
//   • Milky-Way + exposure tuning for an HDR feel
// NOTE: EffectComposer/UnrealBloom and point-light shadow maps were
// evaluated and removed — both break against this scene's
// logarithmicDepthBuffer + 1e6 scale range (washed/black output).
// Loaded after scene-3d.js; methods exist before the instance is built.
// ============================================================
(function () {
  if (typeof SolarSystem3D === 'undefined') return;
  const P = SolarSystem3D.prototype;

  function flareTex(size, inner, outer) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    g.addColorStop(0, inner);
    g.addColorStop(0.22, outer);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
  }
  function ringTex(size, color) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const ctx = c.getContext('2d');
    ctx.translate(size/2, size/2);
    const g = ctx.createRadialGradient(0, 0, size*0.30, 0, 0, size*0.49);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.7, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, size*0.49, 0, Math.PI*2); ctx.fill();
    return new THREE.CanvasTexture(c);
  }

  P.initPremium = function () {
    // No post-processing composer, no lens flare — both break against this
    // scene's logarithmicDepthBuffer (washed output / black occlusion disk).
    this.usePostFX = false;
    this._tunePremiumScene();
  };

  // ─── LENS FLARE (subtle, tasteful) ────────────────────────
  P._initLensflare = function () {
    if (!THREE.Lensflare || !this.sunLight) return;
    const Lensflare = THREE.Lensflare;
    const LensflareElement = THREE.LensflareElement;
    const main = flareTex(512, 'rgba(255,250,235,0.9)', 'rgba(255,196,110,0.28)');
    const ghost = ringTex(128, 'rgba(150,185,255,0.42)');
    const lf = new Lensflare();
    lf.addElement(new LensflareElement(main, 460, 0, new THREE.Color(0xffe9c0)));
    lf.addElement(new LensflareElement(ghost, 48,  0.20, new THREE.Color(0x88aaff)));
    lf.addElement(new LensflareElement(ghost, 80,  0.45, new THREE.Color(0xffb070)));
    lf.addElement(new LensflareElement(ghost, 40,  0.65, new THREE.Color(0x77ffcc)));
    lf.addElement(new LensflareElement(ghost, 70,  0.88, new THREE.Color(0xff88aa)));
    this.sunLight.add(lf);
    this.lensflare = lf;
  };
  P.setLensflare = function (on) {
    if (this.lensflare) this.lensflare.visible = !!on;
  };
  P.setBloom = function (mul) {
    this._bloomMul = (mul == null) ? 1 : mul;
    // Modulate the scene's native sun-glow sprites (correct depth handling,
    // no bleed / no black-disk artifact under logarithmicDepthBuffer).
    const base = this._glowBaseOpacity;
    const glows = [this.sunGlow1, this.sunGlow2, this.sunGlow3, this.sunGlow4];
    if (base) {
      glows.forEach((g, i) => {
        if (!g) return;
        g.material.opacity = base[i] * this._bloomMul;
        g.visible = this._bloomMul > 0.02;
      });
    }
  };

  // ─── SCENE TUNING ─────────────────────────────────────────
  P._tunePremiumScene = function () {
    if (this.milkyway && this.milkyway.material) {
      this.milkyway.material.color = new THREE.Color(0x7c7c92);
    }
    if (this.sunLight) this.sunLight.intensity = 1.75;
    if (this.renderer) this.renderer.toneMappingExposure = 1.12;

    // Bloom is delivered through the scene's existing additive sun-glow
    // sprites (sunGlow1–4) — they depth-test correctly so they never bleed
    // through nearer planets or punch a black disk under the log depth buffer.
    // We just remember their base opacities so setBloom can scale them.
    const sun = this.bodies && this.bodies.sun;
    if (sun && sun.group) {
      this._glowBaseOpacity = [
        this.sunGlow1 ? this.sunGlow1.material.opacity : 1.0,
        this.sunGlow2 ? this.sunGlow2.material.opacity : 0.75,
        this.sunGlow3 ? this.sunGlow3.material.opacity : 0.55,
        this.sunGlow4 ? this.sunGlow4.material.opacity : 0.35,
      ];
      this._bloomMul = (this._bloomMul == null) ? 1 : this._bloomMul;
      if (this.setBloom) this.setBloom(this._bloomMul);
    }
  };
})();
