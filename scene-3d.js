// ============================================================
// 3D SOLAR SYSTEM — THREE.JS SCENE ENGINE
// Renders a real-time WebGL scene with sun, planets, rings,
// asteroid belt, starfield, raycasting, smooth camera flythroughs.
// ============================================================

class SolarSystem3D {
  constructor(container) {
    this.container = container;
    this.bodies = {};        // id -> { group, mesh, rings?, orbit?, atmosphere?, data }
    this.callbacks = {
      onSelect: () => {},
      onHover: () => {},
    };
    this.state = {
      mode: 'hybrid',
      magnify: 5,
      showOrbits: true,
      showLabels: true,
      showAsteroids: true,
      showStars: true,
      showHabitableZone: false,
      showMagnetospheres: false,
      showComets: true,
      showSpacecraft: true,
      showDwarfPlanets: true,
      paused: false,
      simSpeed: 30.0,        // days per real second
      elapsedDays: 0,
      cameraMode: 'free',
      followTarget: null,    // bodyId being followed by camera
      selectedId: null,
      hoveredId: null,
    };
    this.lastFollowPos = null;
    this.keyState = {};
    // Use the current real date as t=0 — Keplerian elements give the
    // actual heliocentric positions for "now".
    this.startDate = new Date();
    this.flyToAnim = null;
    // Extras (dwarfs, comets, spacecraft, overlays) — populated in init()
    this.extras = { dwarf: {}, comets: {}, spacecraft: {} };
    this.habitableZone = null;
    this.magnetospheres = {};
    this.init();
  }

  init() {
    // ---- Renderer ----
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, logarithmicDepthBuffer: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setClearColor(0x030814);
    if (THREE.ACESFilmicToneMapping !== undefined) {
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.05;
    }
    if ('outputColorSpace' in this.renderer && 'SRGBColorSpace' in THREE) {
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    } else if ('outputEncoding' in this.renderer && 'sRGBEncoding' in THREE) {
      this.renderer.outputEncoding = THREE.sRGBEncoding;
    }
    this.container.appendChild(this.renderer.domElement);

    // ---- Scene ----
    this.scene = new THREE.Scene();

    // ---- Camera ----
    // Wide near/far range so we can move from solar-system scale (thousands of
    // units) down to a sub-pixel Pluto in TRUE_SCALE mode. Log depth buffer keeps
    // z-precision sane across this range.
    this.camera = new THREE.PerspectiveCamera(
      55,
      this.container.clientWidth / this.container.clientHeight,
      0.0005,
      80000
    );
    this.camera.position.set(0, 52, 132);
    this.camera.lookAt(0, 0, 0);

    // ---- Controls ----
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 0.002;
    this.controls.maxDistance = 25000;
    this.controls.rotateSpeed = 0.7;
    this.controls.panSpeed = 1.0;
    this.controls.zoomSpeed = 1.1;
    this.controls.screenSpacePanning = true;
    this.controls.enablePan = true;

    // Mouse button mapping (standard 3D viewer conventions):
    //   LEFT  → rotate
    //   MIDDLE→ pan
    //   RIGHT → pan
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.PAN,
      RIGHT: THREE.MOUSE.PAN,
    };
    // Touch (mobile)
    this.controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };

    // Suppress context menu so right-click pan is clean
    this.renderer.domElement.addEventListener('contextmenu', e => e.preventDefault());

    // Shift + left-drag = pan (escape hatch for trackpads without right-click)
    this.renderer.domElement.addEventListener('mousedown', (e) => {
      if (e.button === 0 && e.shiftKey) {
        this.controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
      }
    }, true);
    window.addEventListener('mouseup', (e) => {
      // Always restore on mouseup
      this.controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
    });

    // ---- Lighting ----
    this.ambient = new THREE.AmbientLight(0x222a3a, 0.3);
    this.scene.add(this.ambient);

    this.sunLight = new THREE.PointLight(0xfff2c8, 1.6, 0, 0);
    this.sunLight.position.set(0, 0, 0);
    this.scene.add(this.sunLight);

    // Subtle rim fill so planet night-sides aren't pitch black
    this.fillLight = new THREE.DirectionalLight(0x4060a0, 0.18);
    this.fillLight.position.set(50, 30, 50);
    this.scene.add(this.fillLight);

    // ---- Starfield ----
    this.buildStarfield();

    // ---- Build all bodies ----
    for (const data of window.SOL_DATA) {
      this.buildBody(data);
    }

    // ---- Asteroid belt ----
    this.buildAsteroidBelt();

    // ---- Kuiper belt ----
    this.buildKuiperBelt();

    // ---- Oort cloud (vast spherical shell, toggled off by default) ----
    this.buildOortCloud();

    // ---- Nearest stars beyond the Solar System (toggled off by default) ----
    this.buildNearbyStars();

    // ---- Habitable zone (Sun's circumstellar habitable zone) ----
    this.buildHabitableZone();

    // ---- Ecliptic reference grid (polar grid + degree ticks, toggled off) ----
    this.buildEclipticGrid();

    // ---- Celestial sphere overlays (toggled off) ----
    this.buildMilkyWay();
    this.buildConstellations();

    // ---- Dwarf planets (Ceres, Eris, Makemake, Haumea) ----
    if (window.DWARF_PLANETS) {
      for (const data of window.DWARF_PLANETS) {
        this.buildDwarfPlanet(data);
      }
    }

    // ---- Comets (Halley, Hale-Bopp, NEOWISE) ----
    if (window.COMETS) {
      for (const data of window.COMETS) {
        this.buildComet(data);
      }
    }

    // ---- Spacecraft (Voyagers, Parker, JWST, New Horizons, Pioneer 10) ----
    if (window.SPACECRAFT) {
      for (const data of window.SPACECRAFT) {
        this.buildSpacecraft(data);
      }
    }

    // ---- Magnetospheres (Earth + Jupiter) ----
    this.buildMagnetosphere('earth',   0x66aaff, 6,    18);
    this.buildMagnetosphere('jupiter', 0xff9966, 14,   60);

    // ---- Raycaster ----
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // ---- Resize ----
    this.onResize = this.onResize.bind(this);
    window.addEventListener('resize', this.onResize);

    // ---- Keyboard (WASD free-flight) ----
    this.boundKeyDown = (e) => {
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      this.keyState[e.key.toLowerCase()] = true;
    };
    this.boundKeyUp = (e) => {
      this.keyState[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);

    // ---- Mouse ----
    this.renderer.domElement.addEventListener('mousemove', e => this.onMouseMove(e));
    this.renderer.domElement.addEventListener('click', e => this.onClick(e));

    // ---- Apply initial positions ----
    this.applyScale();

    // ---- Photorealism layer: real surface maps, Earth day/night, Milky Way ----
    if (this.upgradeWithRealTextures) this.upgradeWithRealTextures();

    // ---- Physics & theory overlays (velocity, Hill, Lagrange, barycentre) ----
    if (this.buildPhysicsOverlays) this.buildPhysicsOverlays();

    // ---- Premium layer: bloom/HDR post-processing, lens flare, shadows ----
    if (this.initPremium) this.initPremium();

    // ---- Render loop ----
    this.clock = new THREE.Clock();
    this.animate = this.animate.bind(this);

    // Force correct renderer/camera size after DOM layout is complete.
    // When the constructor runs inside a React effect, clientWidth/clientHeight
    // may still be 0 — a rAF tick later the container is fully painted.
    requestAnimationFrame(() => {
      this.onResize();
      this.animate();
    });
  }

  // ─── STARFIELD ─────────────────────────────────────────
  buildStarfield() {
    const count = 5000;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // Distribute on a large sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 30000 + Math.random() * 15000;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      // Color variation: warm-white to blue-white
      const t = Math.random();
      const tint = Math.random() * 0.3 + 0.7;
      colors[i * 3] = (0.9 + t * 0.1) * tint;
      colors[i * 3 + 1] = (0.92 + t * 0.05) * tint;
      colors[i * 3 + 2] = (0.95 + (1 - t) * 0.05) * tint;
      sizes[i] = Math.random() * 1.5 + 0.5;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    const mat = new THREE.PointsMaterial({
      size: 1.8,
      vertexColors: true,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.95,
    });
    this.starfield = new THREE.Points(geo, mat);
    this.scene.add(this.starfield);

    // Brighter focused stars (overlay)
    const count2 = 200;
    const g2 = new THREE.BufferGeometry();
    const p2 = new Float32Array(count2 * 3);
    for (let i = 0; i < count2; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 35000;
      p2[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      p2[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      p2[i * 3 + 2] = r * Math.cos(phi);
    }
    g2.setAttribute('position', new THREE.BufferAttribute(p2, 3));
    const m2 = new THREE.PointsMaterial({
      size: 4,
      color: 0xffffff,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.9,
    });
    this.starfield2 = new THREE.Points(g2, m2);
    this.scene.add(this.starfield2);
  }

  // ─── BODY BUILD ─────────────────────────────────────────
  buildBody(data) {
    const group = new THREE.Group();
    group.userData = { id: data.id, data };

    // Geometry — high res for sun/big planets, lower for small
    const segments = data.type === 'star' ? 96 : 64;
    const geo = new THREE.SphereGeometry(1, segments, segments / 2);

    // Texture
    const texCanvas = window.generateTexture(data.id, 512);
    const tex = new THREE.CanvasTexture(texCanvas);
    if ('SRGBColorSpace' in THREE) tex.colorSpace = THREE.SRGBColorSpace;
    else if ('sRGBEncoding' in THREE) tex.encoding = THREE.sRGBEncoding;
    tex.wrapS = THREE.RepeatWrapping;

    let mat;
    if (data.type === 'star') {
      mat = new THREE.MeshBasicMaterial({ map: tex });
    } else {
      mat = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.95,
        metalness: 0.0,
      });
    }

    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData = { id: data.id, type: 'body' };

    // Tilt the mesh (axial tilt around Z)
    mesh.rotation.z = THREE.MathUtils.degToRad(data.axialTiltDeg);

    group.add(mesh);

    // ---- Sun special: glow sprites ----
    if (data.type === 'star') {
      this.buildSunGlow(group);
    } else {
      // ---- Locator sprite (planets/dwarf only) ----
      // Stays a constant pixel size; faded based on the body's apparent
      // angular size, so it's only visible when the real sphere is sub-pixel
      // (relevant in TRUE_SCALE — Earth becomes invisible from any wide view).
      const locSprite = this.buildLocatorSprite(data.color);
      group.add(locSprite);
      this.bodies[data.id] = this.bodies[data.id] || {};
      // Stash on the entry record we attach below
      group.userData.locator = locSprite;
    }

    // ---- Earth atmosphere ----
    if (data.id === 'earth') {
      const atmGeo = new THREE.SphereGeometry(1.04, 48, 24);
      const atmMat = new THREE.ShaderMaterial({
        uniforms: { glowColor: { value: new THREE.Color(0x66aaff) } },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vPos;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPos = (modelViewMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * vec4(vPos, 1.0);
          }`,
        fragmentShader: `
          varying vec3 vNormal;
          varying vec3 vPos;
          uniform vec3 glowColor;
          void main() {
            vec3 viewDir = normalize(-vPos);
            float rim = 1.0 - abs(dot(vNormal, viewDir));
            rim = pow(rim, 3.0);
            gl_FragColor = vec4(glowColor, rim * 0.7);
          }`,
        transparent: true,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const atm = new THREE.Mesh(atmGeo, atmMat);
      atm.userData = { type: 'atmosphere' };
      mesh.add(atm);
    }

    // ---- Venus atmosphere ----
    if (data.id === 'venus') {
      const atmGeo = new THREE.SphereGeometry(1.05, 48, 24);
      const atmMat = new THREE.ShaderMaterial({
        uniforms: { glowColor: { value: new THREE.Color(0xffd080) } },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vPos;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPos = (modelViewMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * vec4(vPos, 1.0);
          }`,
        fragmentShader: `
          varying vec3 vNormal;
          varying vec3 vPos;
          uniform vec3 glowColor;
          void main() {
            vec3 viewDir = normalize(-vPos);
            float rim = 1.0 - abs(dot(vNormal, viewDir));
            rim = pow(rim, 2.5);
            gl_FragColor = vec4(glowColor, rim * 0.5);
          }`,
        transparent: true,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const atm = new THREE.Mesh(atmGeo, atmMat);
      mesh.add(atm);
    }

    // ---- Saturn rings ----
    if (data.id === 'saturn') {
      this.buildSaturnRings(mesh);
    }

    // ---- Uranus/Neptune thin rings ----
    if (data.id === 'uranus' || data.id === 'jupiter' || data.id === 'neptune') {
      this.buildThinRings(mesh, data.id);
    }

    this.scene.add(group);

    // ---- Orbit ring (line) ----
    let orbitMesh = null;
    if (data.type !== 'star' && data.distanceAU > 0) {
      orbitMesh = this.buildOrbit(data);
      this.scene.add(orbitMesh);
    }

    this.bodies[data.id] = {
      group, mesh, data, orbit: orbitMesh,
      locator: group.userData.locator || null,
      angle: Math.random() * Math.PI * 2, // initial position for orbital phase
      moons: [], // populated below
    };

    // ---- Moons (orbiting children of the planet group) ----
    if (data.notableMoons && data.notableMoons.length) {
      this.buildMoons(this.bodies[data.id]);
    }
  }

  // ─── MOON TEXTURE (simple noisy rock) ──────────────────────────
  makeMoonTexture(hexColor) {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 64;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(128, 64);
    const hex = (hexColor || '#A89888').replace('#', '');
    const r0 = parseInt(hex.slice(0, 2), 16);
    const g0 = parseInt(hex.slice(2, 4), 16);
    const b0 = parseInt(hex.slice(4, 6), 16);
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 128; x++) {
        const n = (Math.sin(x * 0.42) * Math.cos(y * 0.61) +
                   Math.sin(x * 0.13 + y * 0.21) * 0.7) * 22;
        const i = (y * 128 + x) * 4;
        img.data[i]     = Math.max(0, Math.min(255, r0 + n));
        img.data[i + 1] = Math.max(0, Math.min(255, g0 + n));
        img.data[i + 2] = Math.max(0, Math.min(255, b0 + n));
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    // Crater specks
    for (let k = 0; k < 18; k++) {
      const cx = Math.random() * 128, cy = Math.random() * 64;
      const cr = 1 + Math.random() * 4.5;
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(20,15,10,${0.18 + Math.random() * 0.22})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx - cr * 0.25, cy - cr * 0.25, cr * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,0.06)`;
      ctx.fill();
    }
    return c;
  }

  // ─── BUILD MOONS for a planet entry ────────────────────────────
  buildMoons(planetEntry) {
    const parent = planetEntry.group;
    const parentData = planetEntry.data;
    for (const m of parentData.notableMoons) {
      const tex = new THREE.CanvasTexture(this.makeMoonTexture(m.color));
      if ('SRGBColorSpace' in THREE) tex.colorSpace = THREE.SRGBColorSpace;
      else if ('sRGBEncoding' in THREE) tex.encoding = THREE.sRGBEncoding;
      const geo = new THREE.SphereGeometry(1, 24, 16);
      const mat = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.96,
        metalness: 0.0,
      });
      const moonMesh = new THREE.Mesh(geo, mat);
      moonMesh.userData = { id: m.id, type: 'moon', parentId: parentData.id };
      const moonGroup = new THREE.Group();
      moonGroup.add(moonMesh);
      parent.add(moonGroup);

      // Thin orbit ring around the planet — now an empty buffer that
      // applyScale() fills with sampled Keplerian ellipse points (eccentricity
      // + inclination). Stays correct for all modes.
      const segs = 128;
      const positions = new Float32Array(segs * 3);
      const orbitGeo = new THREE.BufferGeometry();
      orbitGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      orbitGeo.setDrawRange(0, segs);
      const orbitMat = new THREE.LineBasicMaterial({
        color: 0x88a8c8,
        transparent: true,
        opacity: 0.22,
      });
      const orbitLine = new THREE.Line(orbitGeo, orbitMat);
      orbitLine.userData = { type: 'moon-orbit', segments: segs };
      orbitLine.frustumCulled = false;
      parent.add(orbitLine);

      // Locator sprite for moons (mainly relevant in TRUE_SCALE)
      const loc = this.buildLocatorSprite(m.color);
      loc.scale.set(0.5, 0.5, 1);
      moonGroup.add(loc);

      planetEntry.moons.push({
        group: moonGroup, mesh: moonMesh, orbit: orbitLine, locator: loc,
        data: m, angle: Math.random() * Math.PI * 2,
        radius: 0, distance: 0,
      });
    }
  }

  // Write a Keplerian ellipse (semi-major axis = mDist) into a moon's orbit
  // line buffer, accounting for eccentricity + inclination. Tilt is around
  // the local x axis; the ellipse is centred so the parent sits at one focus
  // (shifted by -e along the major axis).
  writeMoonOrbitEllipse(moon, mDist) {
    const segs = moon.orbit.userData.segments || 128;
    const e = moon.data.eccentricity || 0;
    const inc = (moon.data.inclinationDeg || 0) * Math.PI / 180;
    const sinI = Math.sin(inc), cosI = Math.cos(inc);
    const b = Math.sqrt(1 - e * e);
    const arr = moon.orbit.geometry.attributes.position.array;
    for (let i = 0; i < segs; i++) {
      const E = (i / (segs - 1)) * 2 * Math.PI;
      const xp = (Math.cos(E) - e) * mDist;
      const yp = b * Math.sin(E) * mDist;
      arr[i * 3]     = xp;
      arr[i * 3 + 1] = yp * sinI;
      arr[i * 3 + 2] = yp * cosI;
    }
    moon.orbit.geometry.attributes.position.needsUpdate = true;
    moon.orbit.geometry.computeBoundingSphere();
    moon.orbit.scale.set(1, 1, 1);
  }

  // ─── LOCATOR SPRITE (planets in TRUE_SCALE) ────────────────────
  // Constant-pixel-size colored dot used to keep planets findable when their
  // real-scale sphere falls under a pixel. Built additively so it blends
  // cleanly with the lit sphere when zoomed in.
  buildLocatorSprite(hexColor) {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const ctx = c.getContext('2d');
    const hex = (hexColor || '#ffffff').replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16) || 200;
    const g = parseInt(hex.slice(2, 4), 16) || 200;
    const b = parseInt(hex.slice(4, 6), 16) || 200;
    // Refined reticle marker: soft core + thin hollow ring (instrument-grade,
    // reads as a locator mark — never a hard saturated box).
    const core = ctx.createRadialGradient(32, 32, 0, 32, 32, 9);
    core.addColorStop(0, `rgba(255,255,255,0.95)`);
    core.addColorStop(0.5, `rgba(${r},${g},${b},0.55)`);
    core.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = core;
    ctx.beginPath(); ctx.arc(32, 32, 9, 0, Math.PI * 2); ctx.fill();
    // thin ring
    ctx.strokeStyle = `rgba(${r},${g},${b},0.7)`;
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(32, 32, 19, 0, Math.PI * 2); ctx.stroke();
    const tex = new THREE.CanvasTexture(c);
    const mat = new THREE.SpriteMaterial({
      map: tex,
      blending: THREE.NormalBlending,
      depthWrite: false,
      depthTest: true,
      transparent: true,
      opacity: 0,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1, 1, 1);
    sprite.renderOrder = 3;
    return sprite;
  }


  buildSunGlow(group) {
    // Use additive sprites for corona
    const makeGlowSprite = (size, color, opacity) => {
      const c = document.createElement('canvas');
      c.width = 256; c.height = 256;
      const ctx = c.getContext('2d');
      const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      grad.addColorStop(0, color);
      grad.addColorStop(0.4, color.replace(/[\d.]+\)$/, '0.3)'));
      grad.addColorStop(1, 'rgba(255,100,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
      const tex = new THREE.CanvasTexture(c);
      const mat = new THREE.SpriteMaterial({
        map: tex,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity,
      });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(size, size, 1);
      return sprite;
    };

    this.sunGlow1 = makeGlowSprite(14, 'rgba(255,235,140,1.0)', 1.0);
    this.sunGlow2 = makeGlowSprite(22, 'rgba(255,190,80,0.8)', 0.75);
    this.sunGlow3 = makeGlowSprite(40, 'rgba(255,130,40,0.5)', 0.55);
    this.sunGlow4 = makeGlowSprite(80, 'rgba(255,80,20,0.25)', 0.35);
    group.add(this.sunGlow4);
    group.add(this.sunGlow3);
    group.add(this.sunGlow2);
    group.add(this.sunGlow1);
  }

  // ─── SATURN RINGS ─────────────────────────────────
  buildSaturnRings(parent) {
    const innerR = 1.4, outerR = 2.4;
    const segments = 128;
    const ringGeo = new THREE.RingGeometry(innerR, outerR, segments, 8);
    // Custom UV so radial gradient maps correctly
    const pos = ringGeo.attributes.position;
    const uv = ringGeo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      const r = Math.sqrt(x * x + y * y);
      const t = (r - innerR) / (outerR - innerR);
      uv.setXY(i, t, 0.5);
    }
    uv.needsUpdate = true;

    const tex = new THREE.CanvasTexture(window.generateSaturnRingTexture());
    if ('SRGBColorSpace' in THREE) tex.colorSpace = THREE.SRGBColorSpace;
    else if ('sRGBEncoding' in THREE) tex.encoding = THREE.sRGBEncoding;
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, mat);
    ring.rotation.x = Math.PI / 2; // make horizontal
    ring.userData = { type: 'ring' };
    parent.add(ring);
  }

  // ─── THIN RINGS (Jupiter, Uranus, Neptune) ────────────
  buildThinRings(parent, bodyId) {
    const config = {
      jupiter: { inner: 1.5, outer: 2.0, color: [180, 150, 110] },
      uranus: { inner: 1.5, outer: 2.0, color: [140, 220, 230] },
      neptune: { inner: 1.5, outer: 2.0, color: [120, 140, 200] },
    }[bodyId];
    if (!config) return;
    const ringGeo = new THREE.RingGeometry(config.inner, config.outer, 96, 4);
    const pos = ringGeo.attributes.position;
    const uv = ringGeo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      const r = Math.sqrt(x * x + y * y);
      const t = (r - config.inner) / (config.outer - config.inner);
      uv.setXY(i, t, 0.5);
    }
    uv.needsUpdate = true;
    const tex = new THREE.CanvasTexture(window.generateThinRingTexture(config.color));
    if ('SRGBColorSpace' in THREE) tex.colorSpace = THREE.SRGBColorSpace;
    else if ('sRGBEncoding' in THREE) tex.encoding = THREE.sRGBEncoding;
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      opacity: 0.6,
    });
    const ring = new THREE.Mesh(ringGeo, mat);
    ring.rotation.x = Math.PI / 2;
    ring.userData = { type: 'ring' };
    parent.add(ring);
  }

  // ─── ORBIT RING (elliptical from real Keplerian elements) ───────
  buildOrbit(data) {
    // Allocate a buffer; applyScale() will write the sampled ellipse points.
    const segments = 384;
    const positions = new Float32Array(segments * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setDrawRange(0, segments);
    const mat = new THREE.LineBasicMaterial({
      color: data.type === 'dwarf_planet' ? 0xf0b840 : 0x4a8bb5,
      transparent: true,
      opacity: data.type === 'dwarf_planet' ? 0.32 : 0.30,
    });
    const line = new THREE.Line(geo, mat);
    line.userData = { type: 'orbit', id: data.id, segments };
    line.frustumCulled = false;   // long elliptical orbits with one side off-screen
    return line;
  }

  // ─── ASTEROID BELT (3D instanced rocks) ──────────────────────
  // Real-looking irregular chunks rather than billboard squares. Each rock
  // gets a unique scale/rotation; we update per-instance matrices each frame
  // when the simulation is running.
  buildAsteroidBelt() {
    const count = 1800;
    // Slightly irregular icosahedron — fine for thousands of low-res rocks
    const geo = new THREE.IcosahedronGeometry(1, 0);
    // Deform vertices a touch so they don't all look identical-spherical
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const n = (Math.sin(x * 9 + y * 7 + z * 5) + 1) * 0.07;
      pos.setXYZ(i, x * (1 - n), y * (1 - n * 0.7), z * (1 - n * 1.2));
    }
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({
      color: 0x8a7a64,
      roughness: 0.95,
      metalness: 0.05,
      flatShading: true,
    });
    this.asteroidBelt = new THREE.InstancedMesh(geo, mat, count);
    this.asteroidBelt.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.asteroidAUs    = new Float32Array(count);
    this.asteroidAngles = new Float32Array(count);
    this.asteroidTilts  = new Float32Array(count);
    this.asteroidDiamKm = new Float32Array(count);   // real km, scaled per-mode
    this.asteroidScales = new Float32Array(count);
    this.asteroidRotAxes = [];
    this.asteroidRotPhase = new Float32Array(count);
    this.asteroidRotSpeed = new Float32Array(count);

    const colorAttr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      this.asteroidAUs[i] = 2.2 + Math.random() * 1.0;
      this.asteroidAngles[i] = Math.random() * Math.PI * 2;
      this.asteroidTilts[i] = (Math.random() - 0.5) * 0.4;
      // Real asteroid size distribution: 1–200 km, vast majority small.
      const rand = Math.random();
      this.asteroidDiamKm[i] = 1 + Math.pow(rand, 4.5) * 200;
      this.asteroidScales[i] = 0;   // filled by applyScale()
      const ax = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      this.asteroidRotAxes.push(ax);
      this.asteroidRotPhase[i] = Math.random() * Math.PI * 2;
      this.asteroidRotSpeed[i] = (Math.random() - 0.5) * 1.5;
      // Per-rock color tint
      const tint = 0.7 + Math.random() * 0.3;
      colorAttr[i * 3]     = 0.55 * tint;
      colorAttr[i * 3 + 1] = 0.48 * tint;
      colorAttr[i * 3 + 2] = 0.38 * tint;
    }
    this.asteroidBelt.instanceColor = new THREE.InstancedBufferAttribute(colorAttr, 3);
    this.scene.add(this.asteroidBelt);
  }

  // ─── KUIPER BELT (3D instanced icy chunks) ────────────────────
  buildKuiperBelt() {
    const count = 1500;
    const geo = new THREE.IcosahedronGeometry(1, 0);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const n = (Math.sin(x * 11 + y * 6 + z * 8) + 1) * 0.09;
      pos.setXYZ(i, x * (1 - n), y * (1 - n * 1.1), z * (1 - n * 0.8));
    }
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({
      color: 0x9aa8bd,
      roughness: 0.85,
      metalness: 0.08,
      flatShading: true,
    });
    this.kuiperBelt = new THREE.InstancedMesh(geo, mat, count);
    this.kuiperBelt.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.kuiperAUs    = new Float32Array(count);
    this.kuiperAngles = new Float32Array(count);
    this.kuiperTilts  = new Float32Array(count);
    this.kuiperDiamKm = new Float32Array(count);   // real km, scaled per-mode
    this.kuiperScales = new Float32Array(count);   // resulting scene-unit size
    this.kuiperRotAxes = [];
    this.kuiperRotPhase = new Float32Array(count);
    this.kuiperRotSpeed = new Float32Array(count);

    const colorAttr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      this.kuiperAUs[i] = 30 + Math.random() * 20;
      this.kuiperAngles[i] = Math.random() * Math.PI * 2;
      // Kuiper objects on a fatter disk
      this.kuiperTilts[i] = (Math.random() - 0.5) * 2.5;
      // Real-world Kuiper objects: heavily skewed small. Most are 10–200 km;
      // very few approach Pluto's 2377 km. Power-law sampling biases small.
      const rand = Math.random();
      this.kuiperDiamKm[i] = 10 + Math.pow(rand, 4) * 350;   // 10 km → ~360 km max
      this.kuiperScales[i] = 0;   // filled by applyScale()
      const ax = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      this.kuiperRotAxes.push(ax);
      this.kuiperRotPhase[i] = Math.random() * Math.PI * 2;
      this.kuiperRotSpeed[i] = (Math.random() - 0.5) * 1.0;
      const tint = 0.7 + Math.random() * 0.3;
      colorAttr[i * 3]     = 0.55 * tint;
      colorAttr[i * 3 + 1] = 0.6  * tint;
      colorAttr[i * 3 + 2] = 0.7  * tint;
    }
    this.kuiperBelt.instanceColor = new THREE.InstancedBufferAttribute(colorAttr, 3);
    this.scene.add(this.kuiperBelt);
  }

  // ─── OORT CLOUD (faint spherical shell of icy points) ─────────
  // Educational visualization: a vast spherical halo enclosing the whole
  // planetary system. Real Oort cloud spans ~2,000–100,000 AU; here it is
  // drawn at a fixed large scene radius so it reads as "the edge".
  buildOortCloud() {
    const count = 4000;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const baseR = 9000;
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = baseR * (0.7 + Math.random() * 0.6);
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      size: 2.2,
      color: 0x9fc4e8,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    this.oortCloud = new THREE.Points(geo, mat);
    this.oortCloud.visible = false;
    this.oortCloud.frustumCulled = false;
    this.oortCloud.userData = { type: 'oort' };
    this.scene.add(this.oortCloud);
  }

  // ─── NEAREST STARS (labelled billboard sprites on a distant shell) ────
  buildNearbyStars() {
    this.nearbyStars = new THREE.Group();
    this.nearbyStars.visible = false;
    const stars = window.NEARBY_STARS || [];
    const shellR = 22000;
    for (const s of stars) {
      const d = s.dir;
      const len = Math.hypot(d.x, d.y, d.z) || 1;
      const px = d.x / len * shellR, py = d.y / len * shellR, pz = d.z / len * shellR;

      // Glow sprite for the star itself
      const c = document.createElement('canvas');
      c.width = 64; c.height = 64;
      const ctx = c.getContext('2d');
      const hex = (s.color || '#ffffff').replace('#', '');
      const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.3, `rgba(${r},${g},${b},0.95)`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = grad; ctx.fillRect(0, 0, 64, 64);
      const tex = new THREE.CanvasTexture(c);
      const mat = new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, transparent: true });
      const sprite = new THREE.Sprite(mat);
      sprite.position.set(px, py, pz);
      sprite.scale.set(900, 900, 1);
      sprite.userData = { id: 'star_' + s.id, type: 'nearby_star' };
      this.nearbyStars.add(sprite);

      // Label sprite (name + distance)
      const lc = document.createElement('canvas');
      lc.width = 512; lc.height = 96;
      const lctx = lc.getContext('2d');
      lctx.font = 'bold 34px "Space Mono", monospace';
      lctx.textAlign = 'center'; lctx.textBaseline = 'middle';
      lctx.fillStyle = 'rgba(220,235,255,0.95)';
      lctx.shadowColor = 'rgba(0,0,0,0.9)'; lctx.shadowBlur = 6;
      lctx.fillText(s.name, 256, 36);
      lctx.font = '24px "Space Mono", monospace';
      lctx.fillStyle = 'rgba(150,200,235,0.9)';
      lctx.fillText(s.lightYears + ' ly · ' + s.type, 256, 70);
      const ltex = new THREE.CanvasTexture(lc);
      const lmat = new THREE.SpriteMaterial({ map: ltex, depthWrite: false, depthTest: false, transparent: true });
      const lsprite = new THREE.Sprite(lmat);
      lsprite.position.set(px, py - 1400, pz);
      lsprite.scale.set(6000, 1125, 1);
      this.nearbyStars.add(lsprite);
    }
    this.scene.add(this.nearbyStars);
  }

  // ─── HABITABLE ZONE (translucent annular disc) ─────────────────
  // The Sun's circumstellar habitable zone: conservative 0.95–1.67 AU.
  buildHabitableZone() {
    const segments = 96;
    // Will be re-shaped per-mode in applyScale via setUVs; here we just
    // create an annular ring oriented in the X–Z plane (Y-up).
    const innerAU = 0.95, outerAU = 1.67;
    const geo = new THREE.RingGeometry(1, 1.6, segments, 4);
    // Tag positions with their original AU radius so we can re-radius in
    // applyScale without rebuilding the geometry.
    const pos = geo.attributes.position;
    const auMap = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      const r = Math.sqrt(x * x + y * y);
      const t = (r - 1) / (1.6 - 1);    // 0 at inner edge, 1 at outer
      auMap[i] = innerAU + t * (outerAU - innerAU);
    }
    geo.userData = { auMap, innerAU, outerAU };
    const mat = new THREE.MeshBasicMaterial({
      color: 0x4CCB80,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
    });
    this.habitableZone = new THREE.Mesh(geo, mat);
    this.habitableZone.rotation.x = -Math.PI / 2;   // lie flat on ecliptic
    this.habitableZone.visible = false;             // toggle from UI
    this.habitableZone.userData = { type: 'habitable_zone' };
    this.scene.add(this.habitableZone);
  }

  // ─── ECLIPTIC REFERENCE GRID (polar grid + degree ticks + labels) ──────
  // A dim heliocentric coordinate grid on the ecliptic plane (XZ, Y = north).
  // Reads like the reference graticule in pro sky software — concentric range
  // rings, radial spokes every 30°, fine tick marks every 10°, and ecliptic
  // longitude labels. Toggled off by default.
  buildEclipticGrid() {
    const grp = new THREE.Group();
    grp.userData = { type: 'ecliptic_grid' };
    const R = 130;
    const col = 0x4f9fb2;
    const matMinor = new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.12, depthWrite: false });
    const matMajor = new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.26, depthWrite: false });
    const circle = (r, mat) => {
      const seg = 200, pts = [];
      for (let i = 0; i <= seg; i++) { const a = i / seg * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)); }
      grp.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
    };
    // Concentric range rings (every 13 units; emphasise every other)
    for (let i = 1; i <= 10; i++) circle(i * 13, i % 2 === 0 ? matMajor : matMinor);
    // Radial spokes every 30° (cardinals brighter)
    for (let d = 0; d < 360; d += 30) {
      const a = d * Math.PI / 180;
      const g = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(Math.cos(a) * R, 0, Math.sin(a) * R),
      ]);
      grp.add(new THREE.Line(g, d % 90 === 0 ? matMajor : matMinor));
    }
    // Degree ticks every 10° on the outer ring
    for (let d = 0; d < 360; d += 10) {
      const a = d * Math.PI / 180;
      const inner = (d % 30 === 0) ? R - 6 : R - 3;
      const g = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(Math.cos(a) * inner, 0, Math.sin(a) * inner),
        new THREE.Vector3(Math.cos(a) * R, 0, Math.sin(a) * R),
      ]);
      grp.add(new THREE.Line(g, d % 30 === 0 ? matMajor : matMinor));
    }
    // Ecliptic-longitude labels every 30°
    for (let d = 0; d < 360; d += 30) {
      const a = d * Math.PI / 180, lr = R + 8;
      const sp = this.makeGridLabel(d + '\u00B0');
      sp.position.set(Math.cos(a) * lr, 0, Math.sin(a) * lr);
      grp.add(sp);
    }
    grp.visible = false;
    this.eclipticGrid = grp;
    this.scene.add(grp);
  }

  makeGridLabel(text) {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 64;
    const ctx = c.getContext('2d');
    ctx.fillStyle = 'rgba(170, 214, 230, 0.78)';
    ctx.font = '600 30px "Space Mono", monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, 64, 32);
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 2;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.85 });
    const sp = new THREE.Sprite(mat);
    sp.scale.set(8, 4, 1);
    return sp;
  }

  // ─── CELESTIAL SPHERE: equatorial → scene direction ────────────────────
  // RA in hours, Dec in degrees → unit vector in scene space (Y-up, ecliptic
  // = XZ). Goes equatorial → ecliptic (obliquity 23.4393°) → scene mapping.
  _raDecToScene(raH, decDeg, R) {
    const ra = raH * 15 * Math.PI / 180, dec = decDeg * Math.PI / 180;
    const eqx = Math.cos(dec) * Math.cos(ra);
    const eqy = Math.cos(dec) * Math.sin(ra);
    const eqz = Math.sin(dec);
    const e = 23.4393 * Math.PI / 180, ce = Math.cos(e), se = Math.sin(e);
    const ecx = eqx;
    const ecy = eqy * ce + eqz * se;
    const ecz = -eqy * se + eqz * ce;
    // scene: x = ecliptic x, y = ecliptic z (out-of-plane), z = ecliptic y
    return new THREE.Vector3(ecx * R, ecz * R, ecy * R);
  }

  // ─── MILKY WAY BAND (faint great-circle star concentration) ────────────
  buildMilkyWay() {
    const R = 33000, count = 4200;
    const pos = new Float32Array(count * 3);
    const colArr = new Float32Array(count * 3);
    // Galactic plane normal — tilt ~60° from the ecliptic pole
    const tilt = 60.2 * Math.PI / 180;
    const n = new THREE.Vector3(0, Math.cos(tilt), Math.sin(tilt));
    const u = new THREE.Vector3(1, 0, 0);
    const v = new THREE.Vector3().crossVectors(n, u).normalize();
    const gauss = () => { let s = 0; for (let i = 0; i < 3; i++) s += Math.random(); return (s - 1.5) / 1.5; };
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = gauss() * 0.26;                 // band half-width ~15°
      const dir = new THREE.Vector3()
        .addScaledVector(u, Math.cos(theta) * Math.cos(phi))
        .addScaledVector(v, Math.sin(theta) * Math.cos(phi))
        .addScaledVector(n, Math.sin(phi))
        .normalize().multiplyScalar(R * (0.97 + Math.random() * 0.03));
      pos[i * 3] = dir.x; pos[i * 3 + 1] = dir.y; pos[i * 3 + 2] = dir.z;
      const w = 0.55 + Math.random() * 0.45;
      colArr[i * 3] = w; colArr[i * 3 + 1] = w * 0.95; colArr[i * 3 + 2] = w * 0.82;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colArr, 3));
    const mat = new THREE.PointsMaterial({
      size: 260, sizeAttenuation: true, vertexColors: true,
      transparent: true, opacity: 0.5, depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.milkyWay = new THREE.Points(geo, mat);
    this.milkyWay.frustumCulled = false;
    this.milkyWay.visible = false;
    this.milkyWay.userData = { type: 'milky_way' };
    this.scene.add(this.milkyWay);
  }

  // ─── CONSTELLATION LINES (curated bright asterisms) ────────────────────
  buildConstellations() {
    const R = 32000;
    const C = [
      { name: 'Orion', seg: [
        [[5.92,7.41],[5.42,6.35]], [[5.42,6.35],[5.53,-0.30]], [[5.92,7.41],[5.68,-1.94]],
        [[5.68,-1.94],[5.60,-1.20]], [[5.60,-1.20],[5.53,-0.30]],
        [[5.68,-1.94],[5.80,-9.67]], [[5.53,-0.30],[5.24,-8.20]], [[5.80,-9.67],[5.24,-8.20]] ] },
      { name: 'Ursa Major', seg: [
        [[11.06,61.75],[11.03,56.38]], [[11.03,56.38],[11.90,53.69]], [[11.90,53.69],[12.26,57.03]],
        [[12.26,57.03],[11.06,61.75]], [[12.26,57.03],[12.90,55.96]], [[12.90,55.96],[13.40,54.93]], [[13.40,54.93],[13.79,49.31]] ] },
      { name: 'Cassiopeia', seg: [
        [[1.91,63.67],[1.43,60.24]], [[1.43,60.24],[0.95,60.72]], [[0.95,60.72],[0.68,56.54]], [[0.68,56.54],[0.15,59.15]] ] },
      { name: 'Cygnus', seg: [
        [[20.69,45.28],[20.37,40.26]], [[20.37,40.26],[19.51,27.96]],
        [[20.77,33.97],[20.37,40.26]], [[20.37,40.26],[19.75,45.13]] ] },
      { name: 'Leo', seg: [
        [[10.14,11.97],[10.12,16.76]], [[10.12,16.76],[10.33,19.84]],
        [[10.33,19.84],[11.24,20.52]], [[11.24,20.52],[11.82,14.57]], [[11.82,14.57],[10.14,11.97]] ] },
      { name: 'Crux', seg: [
        [[12.44,-63.10],[12.52,-57.11]], [[12.79,-59.69],[12.25,-58.75]] ] },
    ];
    const grp = new THREE.Group();
    const mat = new THREE.LineBasicMaterial({ color: 0x7fa6c0, transparent: true, opacity: 0.30, depthWrite: false });
    C.forEach(con => {
      let cx = 0, cy = 0, cz = 0, n = 0;
      con.seg.forEach(s => {
        const pts = s.map(([ra, dec]) => this._raDecToScene(ra, dec, R));
        pts.forEach(p => { cx += p.x; cy += p.y; cz += p.z; n++; });
        grp.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
      });
      const lbl = this.makeConstellationLabel(con.name);
      lbl.position.set(cx / n, cy / n, cz / n);
      grp.add(lbl);
    });
    grp.visible = false;
    grp.userData = { type: 'constellations' };
    this.constellations = grp;
    this.scene.add(grp);
  }

  makeConstellationLabel(text) {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 64;
    const ctx = c.getContext('2d');
    ctx.fillStyle = 'rgba(150, 188, 212, 0.62)';
    ctx.font = '500 26px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text.toUpperCase(), 128, 32);
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 2;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.7 });
    const sp = new THREE.Sprite(mat);
    sp.scale.set(2600, 650, 1);
    return sp;
  }

  // ─── DWARF PLANETS (full body, including orbit + locator + label) ────
  buildDwarfPlanet(data) {
    const group = new THREE.Group();
    group.userData = { id: data.id, data };
    const tex = new THREE.CanvasTexture(this.makeMoonTexture(data.color));
    if ('SRGBColorSpace' in THREE) tex.colorSpace = THREE.SRGBColorSpace;
    const geo = new THREE.SphereGeometry(1, 48, 24);
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.96 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData = { id: data.id, type: 'body' };
    mesh.rotation.z = THREE.MathUtils.degToRad(data.axialTiltDeg || 0);
    group.add(mesh);

    // Locator sprite for dwarf planets too
    const locSprite = this.buildLocatorSprite(data.color);
    group.add(locSprite);
    group.userData.locator = locSprite;

    this.scene.add(group);

    // Orbit line — only if we have Keplerian elements for this dwarf
    let orbit = null;
    const OM = window.OrbitalMechanics;
    if (OM && OM.ELEMENTS[data.id]) {
      orbit = this.buildOrbit({ ...data, type: 'dwarf_planet' });
      this.scene.add(orbit);
    }

    this.extras.dwarf[data.id] = {
      group, mesh, data, orbit,
      locator: locSprite,
      moons: [],
    };
    // Also register in this.bodies so selection logic + locator updates "just work"
    this.bodies[data.id] = this.extras.dwarf[data.id];

    // Build moons for the dwarf planet (Dysnomia, MK 2, Hi'iaka, Namaka)
    if (data.notableMoons && data.notableMoons.length) {
      this.buildMoons(this.extras.dwarf[data.id]);
    }
  }

  // ─── COMETS (with ion tail near perihelion) ────────────────────
  buildComet(data) {
    const group = new THREE.Group();
    group.userData = { id: data.id, data, type: 'comet' };
    // Nucleus: small irregular icy lump
    const geo = new THREE.IcosahedronGeometry(1, 1);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const n = (Math.sin(x * 7 + y * 5 + z * 9) + 1) * 0.15;
      pos.setXYZ(i, x * (1 - n), y * (1 - n * 1.1), z * (1 - n * 0.9));
    }
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({
      color: 0xD8E8F8,
      roughness: 0.6,
      metalness: 0.05,
      flatShading: true,
    });
    const nucleus = new THREE.Mesh(geo, mat);
    nucleus.userData = { id: data.id, type: 'body' };
    group.add(nucleus);

    // Tail: a billboarded gradient sprite that scales with proximity to Sun.
    const tailCanvas = document.createElement('canvas');
    tailCanvas.width = 256; tailCanvas.height = 64;
    const tctx = tailCanvas.getContext('2d');
    const colHex = data.color.replace('#', '');
    const cr = parseInt(colHex.slice(0, 2), 16);
    const cg = parseInt(colHex.slice(2, 4), 16);
    const cb = parseInt(colHex.slice(4, 6), 16);
    const grad2 = tctx.createLinearGradient(0, 32, 256, 32);
    grad2.addColorStop(0,   `rgba(255,255,255,0.95)`);
    grad2.addColorStop(0.08,`rgba(${cr},${cg},${cb},0.9)`);
    grad2.addColorStop(0.4, `rgba(${cr},${cg},${cb},0.4)`);
    grad2.addColorStop(1,   `rgba(${cr},${cg},${cb},0)`);
    tctx.fillStyle = grad2;
    tctx.beginPath();
    tctx.ellipse(20, 32, 200, 18, 0, 0, Math.PI * 2);
    tctx.fill();
    const tailTex = new THREE.CanvasTexture(tailCanvas);
    const tailMat = new THREE.SpriteMaterial({
      map: tailTex,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0,
    });
    const tail = new THREE.Sprite(tailMat);
    tail.center.set(0.08, 0.5);   // anchor near head
    tail.scale.set(1, 0.25, 1);
    group.add(tail);

    // Orbit line (highly elongated ellipse)
    const orbitGeo = new THREE.BufferGeometry();
    const segments = 384;
    const positions = new Float32Array(segments * 3);
    orbitGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    orbitGeo.setDrawRange(0, segments);
    const orbitMat = new THREE.LineBasicMaterial({
      color: 0x9AD0FF,
      transparent: true,
      opacity: 0.28,
    });
    const orbit = new THREE.Line(orbitGeo, orbitMat);
    orbit.frustumCulled = false;
    orbit.userData = { type: 'orbit', id: data.id, segments };
    this.scene.add(orbit);

    this.scene.add(group);

    this.extras.comets[data.id] = {
      group, mesh: nucleus, tail, orbit, data,
    };
  }

  // ─── SPACECRAFT (small icon + trail) ──────────────────────────────
  buildSpacecraft(data) {
    const group = new THREE.Group();
    group.userData = { id: data.id, data, type: 'spacecraft' };
    // Small geometric icon — octahedron is a nice abstract spacecraft proxy
    const geo = new THREE.OctahedronGeometry(0.4, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(data.color),
      emissive: new THREE.Color(data.color),
      emissiveIntensity: 0.6,
      roughness: 0.4,
      metalness: 0.6,
      flatShading: true,
    });
    const icon = new THREE.Mesh(geo, mat);
    icon.userData = { id: data.id, type: 'body' };
    group.add(icon);

    // Pulsing locator sprite (constant pixel size — these are sub-pixel
    // in real scale, so they need to be findable).
    const loc = this.buildLocatorSprite(data.color);
    loc.material.opacity = 0.85;
    group.add(loc);
    group.userData.locator = loc;

    this.scene.add(group);
    this.extras.spacecraft[data.id] = { group, mesh: icon, locator: loc, data };
  }

  // ─── MAGNETOSPHERE (tear-drop magnetic field visualization) ──────
  // We use an elongated ellipsoid stretched anti-Sunward, with a noise-based
  // shader for the auroral glow on the night side.
  buildMagnetosphere(bodyId, hexColor, sizeForward, sizeBack) {
    const colorTHREE = new THREE.Color(hexColor);
    // Asymmetric egg: short hemisphere toward Sun, long tail away.
    // Build using a scaled sphere; we deform in vertex shader.
    const geo = new THREE.SphereGeometry(1, 48, 32);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        glowColor:    { value: colorTHREE },
        sizeForward:  { value: sizeForward },
        sizeBack:     { value: sizeBack },
        time:         { value: 0 },
      },
      vertexShader: `
        uniform float sizeForward;
        uniform float sizeBack;
        varying vec3 vNormal;
        varying float vAlpha;
        void main() {
          // Stretch the negative-X hemisphere (which we'll align with anti-Sun direction)
          vec3 p = position;
          float forward = max(0.0, p.x);
          float back    = max(0.0, -p.x);
          p.x = forward * sizeForward - back * sizeBack;
          // Pinch the tail
          float r = length(p.yz);
          float pinch = mix(1.0, 0.55, smoothstep(0.0, sizeBack * 0.8, back));
          p.y *= pinch;
          p.z *= pinch;
          // Limb shape
          p.y *= 1.6;
          p.z *= 1.6;
          vNormal = normalize(normalMatrix * normal);
          vAlpha  = smoothstep(0.0, sizeBack * 0.6, back);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform vec3 glowColor;
        varying vec3 vNormal;
        varying float vAlpha;
        void main() {
          vec3 viewDir = vec3(0.0, 0.0, 1.0);
          float fres = pow(1.0 - abs(dot(vNormal, viewDir)), 2.5);
          float a = fres * (0.15 + 0.45 * vAlpha);
          gl_FragColor = vec4(glowColor, a);
        }`,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.visible = false;          // shown when its body is selected (UI)
    mesh.frustumCulled = false;
    mesh.userData = { type: 'magnetosphere', id: bodyId };
    const entry = this.bodies[bodyId];
    if (entry) {
      entry.group.add(mesh);
      this.magnetospheres[bodyId] = mesh;
    }
  }

  // ─── APPLY SCALE FOR EXTRAS ───────────────────────────────────────
  // Called from applyScale() after the standard planet pass. Re-samples
  // dwarf-planet and comet orbits to match the new mode, and re-sizes
  // habitable zone + magnetospheres.
  applyScaleExtras(simDate) {
    const { mode, magnify } = this.state;
    const OM = window.OrbitalMechanics;

    // Dwarf planets — full Keplerian propagation if elements exist.
    for (const id in this.extras.dwarf) {
      const entry = this.extras.dwarf[id];
      const data = entry.data;
      const radius = window.scaleDiameter3D(data.diameterKm, 'dwarf_planet', mode, magnify);
      entry.mesh.scale.set(radius, radius, radius);
      entry.radius = radius;
      entry.distance = window.scaleDistance3D(data.distanceAU, mode);

      if (entry.orbit && OM && OM.ELEMENTS[id]) {
        const segments = entry.orbit.userData.segments;
        const samples = OM.sampleOrbit(id, simDate, segments);
        const arr = entry.orbit.geometry.attributes.position.array;
        for (let i = 0; i < segments; i++) {
          const s = OM.auToSceneVec(samples[i].x, samples[i].y, samples[i].z, mode);
          arr[i * 3]     = s.x;
          arr[i * 3 + 1] = s.y;
          arr[i * 3 + 2] = s.z;
        }
        entry.orbit.geometry.attributes.position.needsUpdate = true;
        entry.orbit.geometry.computeBoundingSphere();
      }

      // Moons of dwarf planets (Dysnomia etc.)
      if (entry.moons && entry.moons.length) {
        for (const moon of entry.moons) {
          const mRadius = window.scaleMoonDiameter3D(
            moon.data.diameterKm, data.diameterKm, radius, mode, magnify);
          const mDist = window.scaleMoonDistance3D(
            moon.data.distFromParentKm, data.diameterKm, radius, mode);
          moon.radius = mRadius;
          moon.distance = mDist;
          moon.mesh.scale.set(mRadius, mRadius, mRadius);
          if (moon.orbit) this.writeMoonOrbitEllipse(moon, mDist);
        }
      }
    }

    // Comets — re-sample orbit
    for (const id in this.extras.comets) {
      const entry = this.extras.comets[id];
      const data = entry.data;
      // Nucleus size — comets are tiny; use small-body scaling
      const nucleusUnits = window.scaleSmallBodyDiameter3D(data.diameterKm, mode, magnify);
      entry.mesh.scale.set(nucleusUnits, nucleusUnits, nucleusUnits);
      entry.radius = nucleusUnits;

      if (entry.orbit && data.elements && OM) {
        const segments = entry.orbit.userData.segments;
        const samples = OM.sampleCometOrbit(data.elements, segments);
        const arr = entry.orbit.geometry.attributes.position.array;
        for (let i = 0; i < segments; i++) {
          const s = OM.auToSceneVec(samples[i].x, samples[i].y, samples[i].z, mode);
          arr[i * 3]     = s.x;
          arr[i * 3 + 1] = s.y;
          arr[i * 3 + 2] = s.z;
        }
        entry.orbit.geometry.attributes.position.needsUpdate = true;
        entry.orbit.geometry.computeBoundingSphere();
      }
    }

    // Spacecraft — fixed icon size (no orbit lines for these)
    for (const id in this.extras.spacecraft) {
      const entry = this.extras.spacecraft[id];
      // Render at a constant small scale matched to current "smallest planet" feel
      const scale = mode === window.SCALE_3D.TRUE_SCALE ? 0.0005 : 0.18 * magnify;
      entry.mesh.scale.set(scale, scale, scale);
      entry.radius = scale;
    }

    // Habitable zone — radius is heliocentric AU mapped through current mode.
    if (this.habitableZone) {
      const innerAU = this.habitableZone.geometry.userData.innerAU;
      const outerAU = this.habitableZone.geometry.userData.outerAU;
      const innerScene = window.scaleDistance3D(innerAU, mode);
      const outerScene = window.scaleDistance3D(outerAU, mode);
      const auMap = this.habitableZone.geometry.userData.auMap;
      const posAttr = this.habitableZone.geometry.attributes.position;
      // Rebuild positions: rescale each vertex's radial distance.
      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i), y = posAttr.getY(i);
        const oldR = Math.sqrt(x * x + y * y);
        if (oldR < 1e-9) continue;
        const auR = auMap[i];
        // Map back: inner edge → innerScene, outer edge → outerScene
        const t = (auR - innerAU) / (outerAU - innerAU);
        const newR = innerScene + t * (outerScene - innerScene);
        posAttr.setXY(i, x / oldR * newR, y / oldR * newR);
      }
      posAttr.needsUpdate = true;
      this.habitableZone.geometry.computeBoundingSphere();
    }
  }

  // ─── UPDATE EXTRAS POSITIONS (called every frame) ─────────────────
  updateExtrasPositions(simDate) {
    const OM = window.OrbitalMechanics;
    if (!OM) return;
    const mode = this.state.mode;

    // Dwarf planets
    for (const id in this.extras.dwarf) {
      const entry = this.extras.dwarf[id];
      if (!OM.ELEMENTS[id]) continue;
      const helio = OM.planetHeliocentricAU(id, simDate);
      if (!helio) continue;
      const s = OM.auToSceneVec(helio.x, helio.y, helio.z, mode);
      entry.group.position.set(s.x, s.y, s.z);
    }

    // Comets
    for (const id in this.extras.comets) {
      const entry = this.extras.comets[id];
      const data = entry.data;
      if (!data.elements) continue;
      const helio = OM.cometHeliocentricAU(data.elements, simDate);
      if (!helio) continue;
      const s = OM.auToSceneVec(helio.x, helio.y, helio.z, mode);
      entry.group.position.set(s.x, s.y, s.z);
      // Tail: orient away from Sun, scale with proximity (inverse-square-ish)
      const helioR_AU = Math.hypot(helio.x, helio.y, helio.z);
      // Visible when within ~5 AU; aggressive falloff
      const tailVisibility = Math.max(0, Math.min(1, (5 - helioR_AU) / 4));
      if (entry.tail) {
        entry.tail.material.opacity = tailVisibility * 0.9;
        // Tail length grows as comet nears Sun
        const tailLen = Math.max(2, (1 / Math.max(0.1, helioR_AU)) * 8);
        entry.tail.scale.set(tailLen, tailLen * 0.18, 1);
        // Orient tail anti-sun: rotate sprite so the gradient origin points away from origin
        const dirX = helio.x, dirY = helio.y, dirZ = helio.z;
        // Sprite center already at left edge; tail extends to the right in sprite-local coords.
        // We can't actually orient a sprite by rotation through 3D (sprites face camera),
        // but for visual purposes the tail looks "away from sun" because we anchor it left.
        // For a richer effect, replace sprite with a billboarded plane in a future pass.
        entry.tail.material.rotation = Math.atan2(dirY, dirX);
      }
    }

    // Spacecraft
    for (const id in this.extras.spacecraft) {
      const entry = this.extras.spacecraft[id];
      const pos = window.spacecraftPositionAU(entry.data, simDate);
      const s = OM.auToSceneVec(pos.x, pos.y, pos.z, mode);
      entry.group.position.set(s.x, s.y, s.z);
      // Spin the octahedron for visual interest
      entry.mesh.rotation.y += 0.02;
      entry.mesh.rotation.x += 0.01;
    }

    // Magnetospheres: align tail anti-sunward
    for (const id in this.magnetospheres) {
      const ms = this.magnetospheres[id];
      if (!ms.visible) continue;
      const bodyEntry = this.bodies[id];
      if (!bodyEntry) continue;
      // Compute direction sun→body in world coords (sun at origin)
      const bp = new THREE.Vector3();
      bodyEntry.group.getWorldPosition(bp);
      // Magnetosphere lives as a CHILD of the body — local origin is body.
      // We want +X of the magnetosphere mesh to point AWAY from sun (anti-sun).
      // Direction in world: bp.normalize().
      const dir = bp.clone().normalize();
      // Look-At: target = body local + dir
      const target = new THREE.Vector3().copy(dir);
      // Rotate the mesh so +X points along dir
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), target);
      ms.quaternion.copy(q);
      // Time update
      ms.material.uniforms.time.value = performance.now() * 0.001;
    }
  }


  applyScale() {
    const { mode, magnify } = this.state;
    const OM = window.OrbitalMechanics;
    const simDate = this.getSimDate();
    for (const data of window.SOL_DATA) {
      const entry = this.bodies[data.id];
      if (!entry) continue;
      const radius = window.scaleDiameter3D(data.diameterKm, data.type, mode, magnify);
      entry.mesh.scale.set(radius, radius, radius);
      entry.radius = radius;

      // Orbit ring — write the sampled Keplerian ellipse (if we have elements)
      // into the line buffer (positions already converted to scene units).
      if (entry.orbit && OM.ELEMENTS[data.id]) {
        const segments = entry.orbit.userData.segments;
        const samples = OM.sampleOrbit(data.id, simDate, segments);
        const arr = entry.orbit.geometry.attributes.position.array;
        for (let i = 0; i < segments; i++) {
          const s = window.OrbitalMechanics.auToSceneVec(samples[i].x, samples[i].y, samples[i].z, mode);
          arr[i * 3]     = s.x;
          arr[i * 3 + 1] = s.y;
          arr[i * 3 + 2] = s.z;
        }
        entry.orbit.geometry.attributes.position.needsUpdate = true;
        entry.orbit.geometry.computeBoundingSphere();
        // Reset any prior scale (legacy circular path applied scale.set(dist,1,dist))
        entry.orbit.scale.set(1, 1, 1);
      }

      // Cache "distance" as semi-major-axis in scene units — used by the
      // legacy follow logic and locator sprite sizing.
      entry.distance = window.scaleDistance3D(data.distanceAU, mode);

      // Moons — scale relative to (re-scaled) parent
      if (entry.moons && entry.moons.length) {
        for (const moon of entry.moons) {
          const mRadius = window.scaleMoonDiameter3D(
            moon.data.diameterKm, data.diameterKm, radius, mode, magnify);
          const mDist   = window.scaleMoonDistance3D(
            moon.data.distFromParentKm, data.diameterKm, radius, mode);
          moon.radius = mRadius;
          moon.distance = mDist;
          moon.mesh.scale.set(mRadius, mRadius, mRadius);
          if (moon.orbit) this.writeMoonOrbitEllipse(moon, mDist);
        }
      }
    }

    // Extras: dwarf planets, comets, spacecraft
    this.applyScaleExtras(simDate);
    // Sun glow scale follows sun radius
    if (this.sunGlow1 && this.bodies.sun) {
      const r = this.bodies.sun.radius;
      this.sunGlow1.scale.set(r * 3.0, r * 3.0, 1);
      this.sunGlow2.scale.set(r * 5.0, r * 5.0, 1);
      this.sunGlow3.scale.set(r * 9, r * 9, 1);
      this.sunGlow4.scale.set(r * 18, r * 18, 1);
    }
    // Sun-light range
    this.sunLight.distance = Math.max(2000, window.scaleDistance3D(45, mode) * 4);

    // Recompute belt scales for the new mode (km → scene units). This makes
    // rocks shrink properly in REAL_SIZE / REAL_DISTANCE so they never outsize
    // Pluto or its moons.
    if (this.asteroidDiamKm && this.asteroidScales) {
      for (let i = 0; i < this.asteroidDiamKm.length; i++) {
        this.asteroidScales[i] = window.scaleSmallBodyDiameter3D(this.asteroidDiamKm[i], mode, magnify);
      }
    }
    if (this.kuiperDiamKm && this.kuiperScales) {
      for (let i = 0; i < this.kuiperDiamKm.length; i++) {
        this.kuiperScales[i] = window.scaleSmallBodyDiameter3D(this.kuiperDiamKm[i], mode, magnify);
      }
    }
  }

  // ─── ANIMATE ─────────────────────────────
  animate() {
    requestAnimationFrame(this.animate);
    const dt = Math.min(this.clock.getDelta(), 0.1);
    if (!this.state.paused) {
      // simSpeed = days per real second (1 = 1 day/sec)
      this.state.elapsedDays += dt * this.state.simSpeed;
    }

    // Update planet positions using real Keplerian ephemeris (J2000 elements
    // with secular rates). Sub-day precision via getSimDate(). Falls back to
    // a stationary body for the Sun (no elements) and any body without a
    // matching elements table entry.
    const simDateNow = this.getSimDate();
    const OM = window.OrbitalMechanics;
    for (const data of window.SOL_DATA) {
      const entry = this.bodies[data.id];
      if (!entry) continue;
      if (data.type !== 'star' && OM && OM.ELEMENTS[data.id]) {
        const helio = OM.planetHeliocentricAU(data.id, simDateNow);
        if (helio) {
          const s = OM.auToSceneVec(helio.x, helio.y, helio.z, this.state.mode);
          entry.group.position.set(s.x, s.y, s.z);
        }
      }
      // Axial rotation (visually exaggerated for readability)
      if (data.rotationPeriodHours !== 0 && !this.state.paused) {
        const rotRate = (1 / Math.abs(data.rotationPeriodHours)) * Math.PI * 2;
        const dir = Math.sign(data.rotationPeriodHours) || 1;
        entry.mesh.rotation.y += dt * this.state.simSpeed * 24 * rotRate * dir * 0.25;
      }

      // Moons orbiting this planet (positions in parent-local frame).
      // Now use Keplerian elements (eccentricity, inclination) so Triton orbits
      // backwards, Nereid traces its e=0.75 ellipse, Iapetus rides 15° above
      // Saturn's equator, etc.
      if (entry.moons && entry.moons.length) {
        const days = this.state.elapsedDays;
        for (const moon of entry.moons) {
          const period = moon.data.orbitalPeriodDays || 1;
          const dir = Math.sign(period) || 1;
          const M = (days / Math.abs(period)) * Math.PI * 2 * dir + moon.angle;
          const e = moon.data.eccentricity || 0;
          const inc = (moon.data.inclinationDeg || 0) * Math.PI / 180;
          // Solve Kepler M = E − e·sin E
          let E = M;
          for (let k = 0; k < 5; k++) {
            E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
          }
          const xp = Math.cos(E) - e;
          const yp = Math.sqrt(1 - e * e) * Math.sin(E);
          // Apply inclination by rotating around the x axis
          moon.group.position.x = xp * moon.distance;
          moon.group.position.y = yp * Math.sin(inc) * moon.distance;
          moon.group.position.z = yp * Math.cos(inc) * moon.distance;
          // Slow visual rotation
          if (!this.state.paused) {
            moon.mesh.rotation.y += dt * this.state.simSpeed * 0.05;
          }
        }
      }
    }

    // Update positions of dwarf planets, comets, spacecraft
    this.updateExtrasPositions(simDateNow);

    // Asteroid belt — InstancedMesh per-instance matrix update
    if (this.asteroidBelt && this.state.showAsteroids) {
      const count = this.asteroidAUs.length;
      const tickFactor = dt * this.state.simSpeed * 0.0007;
      const mat4 = new THREE.Matrix4();
      const pos = new THREE.Vector3();
      const quat = new THREE.Quaternion();
      const scl = new THREE.Vector3();
      const now = performance.now() * 0.001;
      for (let i = 0; i < count; i++) {
        const au = this.asteroidAUs[i];
        this.asteroidAngles[i] += tickFactor / Math.sqrt(au);
        const dist = window.scaleDistance3D(au, this.state.mode);
        pos.set(
          Math.cos(this.asteroidAngles[i]) * dist,
          this.asteroidTilts[i],
          Math.sin(this.asteroidAngles[i]) * dist
        );
        // Per-instance spin
        const rotAngle = this.asteroidRotPhase[i] + now * this.asteroidRotSpeed[i];
        quat.setFromAxisAngle(this.asteroidRotAxes[i], rotAngle);
        // Slight non-uniform scale → irregular rocks
        const s = this.asteroidScales[i];
        scl.set(s, s * 0.85, s * 1.05);
        mat4.compose(pos, quat, scl);
        this.asteroidBelt.setMatrixAt(i, mat4);
      }
      this.asteroidBelt.instanceMatrix.needsUpdate = true;
    }
    if (this.kuiperBelt && this.state.showAsteroids) {
      const count = this.kuiperAUs.length;
      const tickFactor = dt * this.state.simSpeed * 0.00018;
      const mat4 = new THREE.Matrix4();
      const pos = new THREE.Vector3();
      const quat = new THREE.Quaternion();
      const scl = new THREE.Vector3();
      const now = performance.now() * 0.001;
      for (let i = 0; i < count; i++) {
        const au = this.kuiperAUs[i];
        this.kuiperAngles[i] += tickFactor / Math.sqrt(au);
        const dist = window.scaleDistance3D(au, this.state.mode);
        pos.set(
          Math.cos(this.kuiperAngles[i]) * dist,
          this.kuiperTilts[i],
          Math.sin(this.kuiperAngles[i]) * dist
        );
        const rotAngle = this.kuiperRotPhase[i] + now * this.kuiperRotSpeed[i];
        quat.setFromAxisAngle(this.kuiperRotAxes[i], rotAngle);
        const s = this.kuiperScales[i];
        scl.set(s, s * 0.9, s * 1.1);
        mat4.compose(pos, quat, scl);
        this.kuiperBelt.setMatrixAt(i, mat4);
      }
      this.kuiperBelt.instanceMatrix.needsUpdate = true;
    }

    // Sun glow pulsing
    if (this.sunGlow1) {
      const t = performance.now() * 0.0008;
      const base = this.bodies.sun.radius;
      this.sunGlow1.scale.setScalar(base * 3.0 * (1 + 0.04 * Math.sin(t)));
      this.sunGlow2.scale.setScalar(base * 5.0 * (1 + 0.06 * Math.sin(t * 1.3)));
      this.sunGlow3.scale.setScalar(base * 9.0 * (1 + 0.08 * Math.sin(t * 0.7)));
      this.sunGlow4.scale.setScalar(base * 18.0 * (1 + 0.05 * Math.sin(t * 0.4)));
    }

    // Locator sprites: keep planets findable in TRUE_SCALE where their real
    // sphere is sub-pixel from most viewpoints. We do this every frame so the
    // sprite stays at constant pixel size and only shows when the real planet
    // would otherwise be invisible. In other modes the sprite stays hidden.
    this.updateLocatorSprites();

    // Realtime photoreal shading (Earth day/night terminator + cloud drift)
    if (this.updateRealtimeShading) this.updateRealtimeShading();
    // Physics & theory overlays follow the selected body each frame
    if (this.updatePhysicsOverlays) this.updatePhysicsOverlays();

    // Toggle visibility for orbit/asteroid/etc
    for (const id in this.bodies) {
      const entry = this.bodies[id];
      if (entry.orbit) {
        // Standard planets always show; dwarf/comet orbits gated by their toggles
        let show = this.state.showOrbits;
        if (this.extras.dwarf[id] && this.state.showDwarfPlanets === false) show = false;
        entry.orbit.visible = show;
      }
    }
    for (const id in this.extras.comets) {
      const e = this.extras.comets[id];
      if (e.orbit) {
        e.orbit.visible = this.state.showOrbits && this.state.showComets !== false;
      }
    }
    if (this.asteroidBelt) this.asteroidBelt.visible = this.state.showAsteroids;
    if (this.kuiperBelt) this.kuiperBelt.visible = this.state.showAsteroids;
    if (this.starfield) this.starfield.visible = this.state.showStars;
    if (this.starfield2) this.starfield2.visible = this.state.showStars;

    // Camera fly-to animation (with live-tracking + handoff to follow)
    if (this.flyToAnim) {
      const a = this.flyToAnim;
      a.t = Math.min((performance.now() - a.startTime) / a.duration, 1);
      // Filmic ease-in/ease-out (cubic) — slower departure + arrival than the
      // old quadratic, so camera moves read as deliberate, weighted glides.
      const ease = a.t < 0.5
        ? 4 * a.t * a.t * a.t
        : 1 - Math.pow(-2 * a.t + 2, 3) / 2;

      // Re-resolve live position so we land on the moving body (not stale snapshot)
      let endTarget = a.endTarget;
      let endPos = a.endPos;
      if (a.followTarget) {
        const entry = this.bodies[a.followTarget];
        if (entry) {
          const live = new THREE.Vector3();
          entry.group.getWorldPosition(live);
          endTarget = live;
          endPos = live.clone().add(a.endOffset);
        }
      }

      this.camera.position.lerpVectors(a.startPos, endPos, ease);
      this.controls.target.lerpVectors(a.startTarget, endTarget, ease);

      if (a.t >= 1) {
        this.flyToAnim = null;
        // Hand off to follow mode if we're locked onto a body
        if (a.followTarget) {
          this.state.followTarget = a.followTarget;
          const entry = this.bodies[a.followTarget];
          const curr = new THREE.Vector3();
          entry.group.getWorldPosition(curr);
          this.lastFollowPos = curr;
        }
      }
    } else if (this.state.followTarget) {
      // FOLLOW MODE: shift camera + target by body's delta each frame
      const entry = this.bodies[this.state.followTarget];
      if (entry) {
        const curr = new THREE.Vector3();
        entry.group.getWorldPosition(curr);
        if (this.lastFollowPos) {
          const delta = curr.clone().sub(this.lastFollowPos);
          if (delta.lengthSq() > 1e-12) {
            this.camera.position.add(delta);
            this.controls.target.add(delta);
          }
        }
        this.lastFollowPos = curr;
      }
    }

    // WASD free-flight (cancels follow if user moves)
    this.handleKeyboard(dt);

    this.controls.update();
    // Always present to the screen with a clean clear. Some init-time texture
    // / render-target operations can leave the renderer bound to an offscreen
    // target, which would otherwise blank the canvas.
    this.renderer.setRenderTarget(null);
    this.renderer.autoClear = true;
    this.renderer.render(this.scene, this.camera);

    // Notify post-frame subscribers (used by HTML label overlay so labels
    // stay locked to the freshly-rendered camera/body positions)
    if (this.callbacks.onFrame) this.callbacks.onFrame();
  }

  // ─── LOCATOR SPRITE UPDATE (per-frame) ───────────────────────
  // Sized to remain ~6 px on screen; faded out once the real-scale sphere
  // grows beyond a few pixels of apparent radius so it doesn't hover atop
  // the lit planet. Always hidden outside TRUE_SCALE mode.
  updateLocatorSprites() {
    const trueScale = this.state.mode === SCALE_3D.TRUE_SCALE;
    const fovRad = this.camera.fov * Math.PI / 180;
    const viewportH = this.renderer.domElement.clientHeight || 720;
    // World-units per pixel at depth d:   (2 d tan(fov/2)) / viewportH
    const k = (2 * Math.tan(fovRad / 2)) / viewportH;
    const camPos = this.camera.position;

    for (const id in this.bodies) {
      const entry = this.bodies[id];
      if (!entry.locator) continue;
      if (!trueScale) {
        entry.locator.material.opacity = 0;
        entry.locator.visible = false;
        continue;
      }
      const wp = new THREE.Vector3();
      entry.group.getWorldPosition(wp);
      const dist = wp.distanceTo(camPos);
      // Apparent radius of real-scale planet, in pixels:
      const apparentPx = (entry.radius || 0) / (dist * k + 1e-9);
      // Locator should be ~5–7 px radius. Fade out as planet grows past 2 px.
      const targetPxRadius = 6;
      const worldRadius = targetPxRadius * dist * k;
      entry.locator.scale.set(worldRadius * 2.4, worldRadius * 2.4, 1);
      // Opacity ramp: full when planet < 1 px, gone when > 5 px
      let op;
      if (apparentPx < 1)       op = 1.0;
      else if (apparentPx > 5)  op = 0.0;
      else                      op = 1.0 - (apparentPx - 1) / 4;
      // Selection emphasis — ONLY when the real sphere is still tiny on screen,
      // so we never paint a glow square over an already-large selected planet.
      if (this.state.selectedId === id && apparentPx < 2) op = Math.max(op, 0.65);
      entry.locator.material.opacity = op;
      entry.locator.visible = op > 0.01;
    }
  }


  onMouseMove(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    const id = this.pickBody();
    if (id !== this.state.hoveredId) {
      this.state.hoveredId = id;
      this.renderer.domElement.style.cursor = id ? 'pointer' : 'grab';
      this.callbacks.onHover(id);
    }
  }

  onClick(e) {
    const id = this.pickBody();
    if (id) {
      this.callbacks.onSelect(id);
    }
  }

  pickBody() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes = Object.values(this.bodies).map(b => b.mesh);
    const hits = this.raycaster.intersectObjects(meshes, false);
    if (hits.length > 0) {
      return hits[0].object.userData.id;
    }
    return null;
  }

  // ─── CAMERA FLY-TO ───────────────────────────────────────
  flyTo(bodyId, opts) {
    const entry = this.bodies[bodyId];
    if (!entry) return;
    opts = opts || {};
    const duration = opts.duration || 1400;
    // Calculate target world position
    const targetPos = new THREE.Vector3();
    entry.group.getWorldPosition(targetPos);
    // Camera position: offset from body proportional to body radius
    const r = entry.radius;
    // In TRUE_SCALE, bodies can be sub-millimetre (Pluto ≈ 0.0017 u); keep a
    // very small minimum so we actually approach close enough to see them as
    // spheres rather than landing 6 u away from a 0.009 u Earth.
    const trueScale = this.state.mode === SCALE_3D.TRUE_SCALE;
    const minDist = trueScale ? r * 3.5 : 6;
    const dist = Math.max(r * 5, minDist, trueScale ? 0.01 : 6);
    const offset = new THREE.Vector3(dist * 0.6, dist * 0.4, dist);
    // For sun, view from further
    if (bodyId === 'sun') {
      offset.set(0, trueScale ? 1.5 : 20, trueScale ? 3 : 40);
    }
    const cameraEnd = targetPos.clone().add(offset);

    this.flyToAnim = {
      startTime: performance.now(),
      duration,
      startPos: this.camera.position.clone(),
      endPos: cameraEnd,
      startTarget: this.controls.target.clone(),
      endTarget: targetPos.clone(),
      endOffset: offset.clone(),    // keep so we can re-resolve live position
      followTarget: bodyId,         // enable follow-mode on completion
      t: 0,
    };
    this.state.selectedId = bodyId;
    // Clear stale follow while animating
    this.state.followTarget = null;
    this.lastFollowPos = null;
  }

  resetView() {
    const targetPos = new THREE.Vector3(0, 0, 0);
    // Inner-system framing per mode
    let cameraEnd;
    if (this.state.mode === SCALE_3D.TRUE_SCALE) {
      // 1 unit = 1 Sun-diameter. Earth orbit ≈ 107 u → frame inner system.
      cameraEnd = new THREE.Vector3(0, 110, 260);
    } else if (this.state.mode === SCALE_3D.REAL_DISTANCE) {
      cameraEnd = new THREE.Vector3(0, 120, 280);
    } else {
      cameraEnd = new THREE.Vector3(0, 52, 132);
    }
    this.flyToAnim = {
      startTime: performance.now(),
      duration: 1500,
      startPos: this.camera.position.clone(),
      endPos: cameraEnd,
      startTarget: this.controls.target.clone(),
      endTarget: targetPos,
      followTarget: null,
      endOffset: new THREE.Vector3(),
      t: 0,
    };
    this.state.selectedId = null;
    this.state.followTarget = null;
    this.lastFollowPos = null;
  }

  topDownView() {
    let cameraEnd;
    if (this.state.mode === SCALE_3D.TRUE_SCALE) {
      // High enough to see Saturn's orbit (≈ 1024 u).
      cameraEnd = new THREE.Vector3(0, 1400, 0.1);
    } else if (this.state.mode === SCALE_3D.REAL_DISTANCE) {
      cameraEnd = new THREE.Vector3(0, 360, 0.1);
    } else {
      cameraEnd = new THREE.Vector3(0, 280, 0.1);
    }
    this.flyToAnim = {
      startTime: performance.now(),
      duration: 1400,
      startPos: this.camera.position.clone(),
      endPos: cameraEnd,
      startTarget: this.controls.target.clone(),
      endTarget: new THREE.Vector3(0, 0, 0),
      followTarget: null,
      endOffset: new THREE.Vector3(),
      t: 0,
    };
    this.state.followTarget = null;
    this.lastFollowPos = null;
  }

  setMode(mode) {
    const prev = this.state.mode;
    this.state.mode = mode;
    this.applyScale();
    // If switching INTO or OUT OF true-scale, current camera coords no longer
    // make sense — fly to a fresh inner-system frame for the new mode.
    if (prev !== mode && (prev === SCALE_3D.TRUE_SCALE || mode === SCALE_3D.TRUE_SCALE)) {
      this.resetView();
    }
  }
  setMagnify(m) {
    this.state.magnify = m;
    this.applyScale();
  }
  setSimSpeed(s) { this.state.simSpeed = s; }
  setPaused(p) { this.state.paused = p; }
  setShowOrbits(v) { this.state.showOrbits = v; }
  setShowLabels(v) { this.state.showLabels = v; }
  setShowAsteroids(v) { this.state.showAsteroids = v; }
  setShowStars(v) { this.state.showStars = v; }
  setShowHabitableZone(v) {
    this.state.showHabitableZone = v;
    if (this.habitableZone) this.habitableZone.visible = !!v;
  }
  setShowEcliptic(v) {
    this.state.showEcliptic = v;
    if (this.eclipticGrid) this.eclipticGrid.visible = !!v;
  }
  setShowConstellations(v) {
    this.state.showConstellations = v;
    if (this.milkyWay) this.milkyWay.visible = !!v;
    if (this.constellations) this.constellations.visible = !!v;
  }
  setShowMagnetospheres(v) {
    this.state.showMagnetospheres = v;
    // Only show on the currently-selected body's magnetosphere (less visual clutter)
    for (const id in this.magnetospheres) {
      this.magnetospheres[id].visible = !!v && this.state.selectedId === id;
    }
  }
  setSelectedId(id) {
    this.state.selectedId = id;
    // Re-apply magnetosphere visibility — only the selected body's shows
    if (this.state.showMagnetospheres) {
      for (const mid in this.magnetospheres) {
        this.magnetospheres[mid].visible = (mid === id);
      }
    }
  }
  setShowComets(v) {
    this.state.showComets = v;
    for (const id in this.extras.comets) {
      const e = this.extras.comets[id];
      e.group.visible = !!v;
      if (e.orbit) e.orbit.visible = !!v && this.state.showOrbits;
    }
  }
  setShowSpacecraft(v) {
    this.state.showSpacecraft = v;
    for (const id in this.extras.spacecraft) {
      this.extras.spacecraft[id].group.visible = !!v;
    }
  }
  setShowDwarfPlanets(v) {
    this.state.showDwarfPlanets = v;
    for (const id in this.extras.dwarf) {
      const e = this.extras.dwarf[id];
      e.group.visible = !!v;
      if (e.orbit) e.orbit.visible = !!v && this.state.showOrbits;
    }
  }
  setShowOort(v) {
    this.state.showOort = v;
    if (this.oortCloud) this.oortCloud.visible = !!v;
  }
  setShowNearbyStars(v) {
    this.state.showNearbyStars = v;
    if (this.nearbyStars) this.nearbyStars.visible = !!v;
  }
  // Jump to specific date — recomputes elapsedDays so all Keplerian
  // propagations land on the new "now".
  setSimDate(newDate) {
    const ms = (newDate instanceof Date ? newDate : new Date(newDate)).getTime();
    const baseMs = this.startDate.getTime();
    this.state.elapsedDays = (ms - baseMs) / 86400000;
    // Trigger a position update on the next frame; also refresh orbit samples
    // so eccentric planets like Pluto draw their current-epoch ellipse.
    this.applyScale();
  }

  getSimDate() {
    // Sub-day precision — needed for smooth Keplerian propagation.
    return new Date(this.startDate.getTime() + this.state.elapsedDays * 86400000);
  }

  getCameraDistanceFromSun() {
    return this.camera.position.length();
  }

  // Get screen position of a body for label overlay
  getScreenPosition(bodyId) {
    const entry = this.bodies[bodyId];
    if (!entry) return null;
    const v = new THREE.Vector3();
    entry.group.getWorldPosition(v);
    // Check if behind camera
    const camToBody = v.clone().sub(this.camera.position);
    const camDir = new THREE.Vector3();
    this.camera.getWorldDirection(camDir);
    if (camToBody.dot(camDir) < 0) return null; // behind
    v.project(this.camera);
    const rect = this.renderer.domElement.getBoundingClientRect();
    return {
      x: (v.x * 0.5 + 0.5) * rect.width,
      y: (-v.y * 0.5 + 0.5) * rect.height,
      distance: camToBody.length(),
    };
  }

  onResize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    if (this.composer) this.composer.setSize(w, h);
    if (this.bloomPass) this.bloomPass.setSize(w, h);
  }

  // ─── WASD FREE-FLIGHT ─────────────────────────────────────
  handleKeyboard(dt) {
    const k = this.keyState;
    const moving =
      k['w'] || k['s'] || k['a'] || k['d'] || k['q'] || k['e'] || k[' '] ||
      k['arrowup'] || k['arrowdown'] || k['arrowleft'] || k['arrowright'];
    if (!moving) return;

    // Adaptive speed: scale with distance from target so movement feels
    // consistent whether you're up close to a planet or zoomed system-wide.
    const camToTarget = this.camera.position.distanceTo(this.controls.target);
    const base = Math.max(2, camToTarget * 0.8);
    const boost = k['shift'] ? 4.0 : 1.0;
    const step = base * boost * dt;

    const fwd = new THREE.Vector3();
    this.camera.getWorldDirection(fwd);
    const right = new THREE.Vector3().crossVectors(fwd, this.camera.up).normalize();
    const upDir = this.camera.up.clone().normalize();

    const move = new THREE.Vector3();
    if (k['w'] || k['arrowup'])    move.add(fwd);
    if (k['s'] || k['arrowdown'])  move.sub(fwd);
    if (k['d'] || k['arrowright']) move.add(right);
    if (k['a'] || k['arrowleft'])  move.sub(right);
    if (k['e'] || k[' '])          move.add(upDir);
    if (k['q'])                    move.sub(upDir);

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(step);
      this.camera.position.add(move);
      this.controls.target.add(move);
      // Free flight cancels follow-mode (user took manual control)
      if (this.state.followTarget) {
        this.state.followTarget = null;
        this.lastFollowPos = null;
      }
    }
  }

  dispose() {
    window.removeEventListener('resize', this.onResize);
    if (this.boundKeyDown) window.removeEventListener('keydown', this.boundKeyDown);
    if (this.boundKeyUp) window.removeEventListener('keyup', this.boundKeyUp);
    this.renderer.dispose();
  }
}

window.SolarSystem3D = SolarSystem3D;
