// ============================================================
// REAL TEXTURE / PHOTOREALISM UPGRADE LAYER
// Loads real photographic / NASA-derived surface maps and swaps
// them onto the bodies built by scene-3d.js. Adds:
//   • Earth day/night terminator shader (city lights on night side,
//     ocean specular on day side)
//   • A slowly-rotating Earth cloud shell
//   • Bump maps for rocky bodies
//   • A Milky Way celestial-sphere backdrop
// The procedural canvas textures stay as the instant fallback, so the
// scene is never blank while the real maps stream in (and still works
// fully offline once the maps are cached locally in /textures).
//
// TEXTURE SOURCES (all CC-BY / public-domain derived):
//   • Planet & moon maps, clouds, specular, bump  — james hastings-trew /
//     "Planet Pixel Emporium" maps as mirrored in jeromeetienne/threex.planets
//   • Earth night lights (earth_lights_2048)      — NASA Earth Observatory
//     "Black Marble", via the three.js examples texture set
//   • Milky Way panorama                          — NASA/Solar System Scope
// ============================================================

(function () {
  const TB = 'textures/';

  // id → texture file set. Only ids present here get a real-texture swap;
  // everything else keeps its procedural canvas texture.
  const REAL_TEX = {
    sun:     { map: 'sunmap.jpg', emissive: true },
    mercury: { map: 'mercurymap.jpg', bump: 'mercurybump.jpg', bumpScale: 0.006 },
    venus:   { map: 'venusmap.jpg',   bump: 'venusbump.jpg',   bumpScale: 0.006 },
    earth:   { earth: true,
               day: 'earthmap1k.jpg', night: 'earth_lights_2048.png',
               spec: 'earthspec1k.jpg', bump: 'earthbump1k.jpg',
               clouds: 'earthcloudmap.jpg' },
    mars:    { map: 'marsmap1k.jpg',  bump: 'marsbump1k.jpg',  bumpScale: 0.008 },
    jupiter: { map: 'jupitermap.jpg' },
    saturn:  { map: 'saturnmap.jpg' },
    uranus:  { map: 'uranusmap.jpg' },
    neptune: { map: 'neptunemap.jpg' },
    pluto:   { map: 'plutomap1k.jpg', bump: 'plutobump1k.jpg', bumpScale: 0.006 },
    luna:    { map: 'moonmap1k.jpg',  bump: 'moonbump1k.jpg',  bumpScale: 0.008 },
  };
  window.REAL_TEX = REAL_TEX;

  function setSRGB(tex) {
    if ('SRGBColorSpace' in THREE) tex.colorSpace = THREE.SRGBColorSpace;
    else if ('sRGBEncoding' in THREE) tex.encoding = THREE.sRGBEncoding;
  }

  // ─── Day/night terminator shader for Earth ───────────────────────
  // Lit entirely in-shader from a single sun-direction uniform so the
  // terminator, city lights and ocean glint all stay physically aligned
  // with the real Sun position (which sits at the scene origin).
  const EARTH_VERT = `
    varying vec2 vUv;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPos;
    void main() {
      vUv = uv;
      vWorldNormal = normalize(mat3(modelMatrix) * normal);
      vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`;

  const EARTH_FRAG = `
    uniform sampler2D dayTex;
    uniform sampler2D nightTex;
    uniform sampler2D specTex;
    uniform vec3 sunDir;
    varying vec2 vUv;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPos;
    vec3 toLinear(vec3 c){ return pow(c, vec3(2.2)); }
    void main() {
      vec3 N = normalize(vWorldNormal);
      vec3 L = normalize(sunDir);
      float ndl = dot(N, L);
      // Soft terminator band
      float dayAmt = smoothstep(-0.12, 0.22, ndl);

      vec3 day   = toLinear(texture2D(dayTex,   vUv).rgb);
      vec3 night = toLinear(texture2D(nightTex, vUv).rgb);
      float ocean = texture2D(specTex, vUv).r;  // oceans bright in spec map

      // Daylight intensity falls off near the limb (Lambert)
      vec3 lit = day * (0.08 + 0.92 * max(ndl, 0.0));

      // City lights only on the true night side, fade through terminator
      vec3 lights = night * (1.0 - dayAmt) * 1.7;

      vec3 color = mix(lights, lit, dayAmt);

      // Ocean specular glint (Blinn-Phong) on the day side
      vec3 V = normalize(cameraPosition - vWorldPos);
      vec3 H = normalize(L + V);
      float spec = pow(max(dot(N, H), 0.0), 60.0) * ocean * max(ndl, 0.0);
      color += vec3(1.0, 0.97, 0.88) * spec * 0.7;

      gl_FragColor = vec4(color, 1.0);
    }`;

  // ─── PROTOTYPE EXTENSIONS ────────────────────────────────────────
  const P = SolarSystem3D.prototype;

  P.upgradeWithRealTextures = function () {
    window.__sol = this;
    if (!THREE.TextureLoader) return;
    const loader = new THREE.TextureLoader();
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy
      ? this.renderer.capabilities.getMaxAnisotropy() : 1;
    this._realLoader = loader;
    this._maxAniso = maxAniso;

    const load = (file, srgb) => {
      const t = loader.load(TB + file);
      t.anisotropy = maxAniso;
      t.wrapS = THREE.RepeatWrapping;
      if (srgb) setSRGB(t);
      return t;
    };

    for (const id in REAL_TEX) {
      const cfg = REAL_TEX[id];
      const entry = this.bodies[id] || (this.findMoonEntry && this.findMoonEntry(id));
      const mesh = this._meshForId(id);
      if (!mesh) continue;

      if (cfg.earth) {
        this._upgradeEarth(mesh, cfg, load);
        continue;
      }

      // Swap the colour map in place (keeps the existing material type:
      // MeshBasicMaterial for the Sun, MeshStandardMaterial for planets).
      const tex = load(cfg.map, true);
      const mat = mesh.material;
      mat.map = tex;
      if (cfg.emissive) {
        // Sun: make it genuinely self-luminous from the real photosphere map
        mat.color = new THREE.Color(0xffffff);
      }
      if (cfg.bump) {
        mat.bumpMap = load(cfg.bump, false);
        mat.bumpScale = cfg.bumpScale || 0.005;
      }
      mat.needsUpdate = true;
    }

    this._buildMilkyWay(loader, maxAniso);
  };

  // Resolve the sphere mesh for a body OR a named moon (luna lives under earth).
  P._meshForId = function (id) {
    if (this.bodies[id] && this.bodies[id].mesh) return this.bodies[id].mesh;
    // search moons
    for (const bid in this.bodies) {
      const b = this.bodies[bid];
      if (b.moons) {
        for (const m of b.moons) {
          if (m.data && m.data.id === id) return m.mesh;
        }
      }
    }
    return null;
  };

  P._upgradeEarth = function (mesh, cfg, load) {
    const dayTex   = load(cfg.day, true);
    const nightTex = load(cfg.night, true);
    const specTex  = load(cfg.spec, false);

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        dayTex:   { value: dayTex },
        nightTex: { value: nightTex },
        specTex:  { value: specTex },
        sunDir:   { value: new THREE.Vector3(1, 0, 0) },
      },
      vertexShader: EARTH_VERT,
      fragmentShader: EARTH_FRAG,
    });
    // Replace the standard material; keep the atmosphere child intact.
    mesh.material = mat;
    mesh.material.needsUpdate = true;
    this._earthMesh = mesh;
    this._earthMat = mat;

    // Cloud shell — a slightly larger sphere, lit by the real Sun point light.
    const cloudTex = load(cfg.clouds, true);
    const cloudGeo = new THREE.SphereGeometry(1.012, 64, 32);
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      alphaMap: cloudTex,        // white clouds = opaque, black sky = clear
      transparent: true,
      depthWrite: false,
      roughness: 1.0,
      metalness: 0.0,
      opacity: 0.92,
    });
    const clouds = new THREE.Mesh(cloudGeo, cloudMat);
    clouds.userData = { type: 'clouds' };
    mesh.add(clouds);
    this._earthClouds = clouds;
  };

  // ─── Milky Way celestial backdrop ────────────────────────────────
  P._buildMilkyWay = function (loader, maxAniso) {
    const tex = loader.load(TB + 'stars_milky_way.jpg');
    tex.anisotropy = maxAniso;
    setSRGB(tex);
    const geo = new THREE.SphereGeometry(62000, 64, 40);
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      side: THREE.BackSide,
      color: 0x5c5c6e,          // dim it so the band is a subtle backdrop
      depthWrite: false,
      fog: false,
    });
    const sky = new THREE.Mesh(geo, mat);
    // Tilt so the galactic plane crosses the ecliptic at a realistic ~60°.
    sky.rotation.set(Math.PI * 0.33, 0.4, 0.1);
    sky.renderOrder = -1;
    this.milkyway = sky;
    this.scene.add(sky);
  };

  // ─── Per-frame update (called from animate) ──────────────────────
  P.updateRealtimeShading = function () {
    // Earth: feed the live Sun→Earth direction (Sun sits at the origin).
    if (this._earthMat && this._earthMesh) {
      const ep = new THREE.Vector3();
      this._earthMesh.getWorldPosition(ep);
      // Direction from Earth toward the Sun (origin)
      this._earthMat.uniforms.sunDir.value.copy(ep).multiplyScalar(-1).normalize();
    }
    // Clouds drift slightly faster than the surface rotates.
    if (this._earthClouds && !this.state.paused) {
      this._earthClouds.rotation.y += 0.0006;
    }
  };
})();
