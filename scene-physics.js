// ============================================================
// SCENE PHYSICS OVERLAYS
// Visual, geometrically-accurate overlays for the SELECTED body:
//   • Velocity vector (instantaneous orbital motion, vis-viva)
//   • Radius vector + swept wedge (Kepler's 2nd law)
//   • Hill sphere (gravitational dominance — moon-stable zone)
//   • Lagrange points L1–L5 (restricted 3-body equilibria)
//   • Sun–planet barycentre marker
// All positions are computed in heliocentric AU then mapped through the
// same auToSceneVec() the planets use, so they stay correct in every
// scale mode.
// ============================================================

(function () {
  const P = SolarSystem3D.prototype;
  const TAU = Math.PI * 2;

  const COL = {
    velocity: 0x39e6c8,
    radius:   0xf0b840,
    sweep:    0xf0b840,
    hill:     0x4d9fff,
    lagrange: 0xff7ad0,
    bary:     0xffe27a,
  };

  P.buildPhysicsOverlays = function () {
    const g = new THREE.Group();
    g.userData = { type: 'physics_overlays' };
    this.physicsGroup = g;
    this.scene.add(g);

    this.physState = {
      velocity: false, areaSweep: false, hill: false,
      lagrange: false, barycentre: false,
    };

    // ── Velocity arrow ──
    this._velArrow = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, COL.velocity, 0.6, 0.35);
    this._velArrow.visible = false;
    g.add(this._velArrow);

    // ── Radius vector (Sun → planet) ──
    this._radiusLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
      new THREE.LineBasicMaterial({ color: COL.radius, transparent: true, opacity: 0.7 }));
    this._radiusLine.visible = false;
    g.add(this._radiusLine);

    // ── Swept-area wedge (Kepler II) ──
    this._sweepMesh = new THREE.Mesh(
      new THREE.BufferGeometry(),
      new THREE.MeshBasicMaterial({
        color: COL.sweep, transparent: true, opacity: 0.22,
        side: THREE.DoubleSide, depthWrite: false }));
    this._sweepMesh.visible = false;
    g.add(this._sweepMesh);

    // ── Hill sphere ring (in the ecliptic) ──
    {
      const N = 96;
      const pts = [];
      for (let i = 0; i <= N; i++) pts.push(new THREE.Vector3());
      this._hillRing = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: COL.hill, transparent: true, opacity: 0.8 }));
      this._hillRing.visible = false;
      this._hillRing.userData.N = N;
      g.add(this._hillRing);
    }

    // ── Lagrange point markers (5 sprites) ──
    this._lagrange = [];
    for (let i = 0; i < 5; i++) {
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({
        map: makeLagrangeSprite('L' + (i + 1)),
        transparent: true, depthTest: false, depthWrite: false }));
      spr.renderOrder = 7;
      spr.visible = false;
      g.add(spr);
      this._lagrange.push(spr);
    }

    // ── Barycentre marker ──
    this._baryMarker = new THREE.Mesh(
      new THREE.SphereGeometry(1, 12, 12),
      new THREE.MeshBasicMaterial({ color: COL.bary }));
    this._baryMarker.visible = false;
    g.add(this._baryMarker);
    this._baryRing = new THREE.Mesh(
      new THREE.RingGeometry(1.6, 2.1, 32),
      new THREE.MeshBasicMaterial({ color: COL.bary, transparent: true, opacity: 0.5, side: THREE.DoubleSide }));
    this._baryRing.rotation.x = -Math.PI / 2;
    this._baryRing.visible = false;
    g.add(this._baryRing);
  };

  function makeLagrangeSprite(text) {
    const s = 128;
    const c = document.createElement('canvas');
    c.width = c.height = s;
    const x = c.getContext('2d');
    const cx = s / 2, cy = s / 2 - 14;
    // glow disc
    x.fillStyle = 'rgba(255,122,208,0.22)';
    x.beginPath(); x.arc(cx, cy, 44, 0, TAU); x.fill();
    x.strokeStyle = '#ff7ad0'; x.lineWidth = 5;
    x.beginPath(); x.arc(cx, cy, 30, 0, TAU); x.stroke();
    // crosshair
    x.beginPath(); x.moveTo(cx - 22, cy); x.lineTo(cx + 22, cy);
    x.moveTo(cx, cy - 22); x.lineTo(cx, cy + 22); x.stroke();
    // label below
    x.font = 'bold 34px monospace';
    x.fillStyle = '#ffd6ef';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(text, cx, cy + 56);
    const t = new THREE.CanvasTexture(c);
    return t;
  }

  // ─── Toggle setters (wired from the React panel) ───────────────
  P.setPhysVelocity   = function (v) { this.physState.velocity   = !!v; };
  P.setPhysAreaSweep  = function (v) { this.physState.areaSweep  = !!v; this._sweepHist = null; };
  P.setPhysHill       = function (v) { this.physState.hill       = !!v; };
  P.setPhysLagrange   = function (v) { this.physState.lagrange   = !!v; };
  P.setPhysBarycentre = function (v) { this.physState.barycentre = !!v; };

  // Helper: heliocentric AU (scene-axis convention) for any selectable body.
  P._helioAU = function (id, date) {
    const OM = window.OrbitalMechanics;
    if (!OM) return null;
    if (OM.ELEMENTS[id]) return OM.planetHeliocentricAU(id, date);
    return null;
  };

  // ─── Per-frame update ──────────────────────────────────────────
  P.updatePhysicsOverlays = function () {
    if (!this.physState) return;
    const OM = window.OrbitalMechanics;
    const Phys = window.Physics;
    const id = this.state.selectedId;
    const mode = this.state.mode;
    const date = this.getSimDate ? this.getSimDate() : new Date();

    const anyOn = this.physState.velocity || this.physState.areaSweep ||
                  this.physState.hill || this.physState.lagrange || this.physState.barycentre;
    const helio = (anyOn && id && OM && OM.ELEMENTS[id] && id !== 'sun')
      ? OM.planetHeliocentricAU(id, date) : null;

    // Hide everything when not applicable
    if (!helio || !Phys) {
      this._velArrow.visible = false;
      this._radiusLine.visible = false;
      this._sweepMesh.visible = false;
      this._hillRing.visible = false;
      this._baryMarker.visible = false;
      this._baryRing.visible = false;
      this._lagrange.forEach(s => s.visible = false);
      return;
    }

    const planetScene = OM.auToSceneVec(helio.x, helio.y, helio.z, mode);
    const planetVec = new THREE.Vector3(planetScene.x, planetScene.y, planetScene.z);
    const rAU = Math.hypot(helio.x, helio.y, helio.z);
    const radialUnit = new THREE.Vector3(helio.x, helio.y, helio.z).normalize();

    // ── Velocity vector ──
    if (this.physState.velocity) {
      const dtDays = 2;
      const future = new Date(date.getTime() + dtDays * 86400000);
      const h2 = OM.planetHeliocentricAU(id, future);
      const s2 = OM.auToSceneVec(h2.x, h2.y, h2.z, mode);
      const dir = new THREE.Vector3(s2.x - planetScene.x, s2.y - planetScene.y, s2.z - planetScene.z);
      const len = dir.length();
      if (len > 1e-6) {
        // Visual length: scale so it's a readable fraction of the orbit radius
        const visLen = Math.max(planetVec.length() * 0.16, this.bodies[id] ? this.bodies[id].radius * 3 : 4);
        this._velArrow.position.copy(planetVec);
        this._velArrow.setDirection(dir.clone().normalize());
        this._velArrow.setLength(visLen, visLen * 0.28, visLen * 0.16);
        this._velArrow.visible = true;
      }
    } else this._velArrow.visible = false;

    // ── Radius vector + swept wedge (Kepler II) ──
    if (this.physState.areaSweep) {
      const pos = this._radiusLine.geometry.attributes.position;
      pos.setXYZ(0, 0, 0, 0);
      pos.setXYZ(1, planetVec.x, planetVec.y, planetVec.z);
      pos.needsUpdate = true;
      this._radiusLine.visible = true;

      // Wedge spans a fixed fraction of the orbit so it's always visible —
      // the lesson is that this wedge's AREA is constant even as its shape
      // changes between perihelion (fat/short) and aphelion (thin/long).
      const data = (window.SOL_DATA || []).find(b => b.id === id);
      const periodDays = data && data.orbitalPeriodDays ? data.orbitalPeriodDays : 365;
      const sweepDays = Math.max(6, periodDays * 0.045);
      const past = new Date(date.getTime() - sweepDays * 86400000);
      const hp = OM.planetHeliocentricAU(id, past);
      const sp = OM.auToSceneVec(hp.x, hp.y, hp.z, mode);
      const verts = new Float32Array([
        0, 0, 0,
        planetVec.x, planetVec.y, planetVec.z,
        sp.x, sp.y, sp.z,
      ]);
      this._sweepMesh.geometry.setAttribute('position', new THREE.BufferAttribute(verts, 3));
      this._sweepMesh.geometry.computeVertexNormals();
      this._sweepMesh.visible = true;
    } else {
      this._radiusLine.visible = false;
      this._sweepMesh.visible = false;
    }

    // ── Hill sphere ring ──
    if (this.physState.hill) {
      const hillAU = Phys.hillRadiusAU(id);
      const N = this._hillRing.userData.N;
      const pos = this._hillRing.geometry.attributes.position;
      // tangent basis in the ecliptic (x-z plane), centred on the planet
      for (let i = 0; i <= N; i++) {
        const a = (i / N) * TAU;
        const ox = helio.x + hillAU * Math.cos(a);
        const oz = helio.z + hillAU * Math.sin(a);
        const m = OM.auToSceneVec(ox, helio.y, oz, mode);
        pos.setXYZ(i, m.x, m.y, m.z);
      }
      pos.needsUpdate = true;
      this._hillRing.geometry.computeBoundingSphere();
      this._hillRing.visible = true;
    } else this._hillRing.visible = false;

    // ── Lagrange points ──
    if (this.physState.lagrange) {
      const hillAU = Phys.hillRadiusAU(id);
      // L1 / L2 along the Sun–planet line (±Hill radius); L3 opposite side
      const pts = [];
      // L1 (sunward), L2 (anti-sun)
      pts.push(radialUnit.clone().multiplyScalar(rAU - hillAU));
      pts.push(radialUnit.clone().multiplyScalar(rAU + hillAU));
      // L3 — opposite side of the Sun, ~same radius
      pts.push(radialUnit.clone().multiplyScalar(-rAU));
      // L4 / L5 — rotate the planet's position ±60° about the ecliptic normal (y)
      for (const sign of [1, -1]) {
        const ang = sign * Math.PI / 3;
        const ca = Math.cos(ang), sa = Math.sin(ang);
        const x = helio.x * ca - helio.z * sa;
        const z = helio.x * sa + helio.z * ca;
        pts.push(new THREE.Vector3(x, helio.y, z));
      }
      const sizeBase = Math.max(planetVec.length() * 0.12, 7);
      pts.forEach((auPt, i) => {
        const m = OM.auToSceneVec(auPt.x, auPt.y, auPt.z, mode);
        this._lagrange[i].position.set(m.x, m.y, m.z);
        this._lagrange[i].scale.setScalar(sizeBase);
        this._lagrange[i].visible = true;
      });
    } else this._lagrange.forEach(s => s.visible = false);

    // ── Barycentre ──
    if (this.physState.barycentre) {
      const baryAU = Phys.barycentreFromSunAU(id);
      const m = OM.auToSceneVec(radialUnit.x * baryAU, radialUnit.y * baryAU, radialUnit.z * baryAU, mode);
      // Size the marker relative to the Sun so the "inside/outside the Sun" story reads
      const sunR = this.bodies.sun ? this.bodies.sun.radius : 4;
      this._baryMarker.position.set(m.x, m.y, m.z);
      this._baryMarker.scale.setScalar(Math.max(sunR * 0.04, 0.4));
      this._baryMarker.visible = true;
      this._baryRing.position.set(m.x, m.y, m.z);
      this._baryRing.scale.setScalar(Math.max(sunR * 0.04, 0.4));
      this._baryRing.visible = true;
    } else {
      this._baryMarker.visible = false;
      this._baryRing.visible = false;
    }
  };
})();
