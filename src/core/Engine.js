import * as THREE from 'three';

export class Engine {
  constructor(container) {
    this.container = container;
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060408);
    // Dark horror fog with burnt orange / purple undertones
    this.scene.fog = new THREE.FogExp2(0x09060b, 0.055);

    // Camera (Player eyes)
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      80
    );
    this.camera.position.set(0, 1.6, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isMobile,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.isMobile ? 1.5 : 2.0));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !this.isMobile;
    if (this.renderer.shadowMap.enabled) {
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    this.container.appendChild(this.renderer.domElement);

    // Horror Lighting Setup
    this.flickerLights = [];
    this.initHorrorLighting();

    // Clock
    this.clock = new THREE.Clock();

    // Listeners
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  initHorrorLighting() {
    // Very dim ambient light so shadows are deep and scary
    const ambientLight = new THREE.AmbientLight(0x191024, 0.55);
    this.scene.add(ambientLight);

    // Subtle moon/skylight filtering through cracked windows
    const dirLight = new THREE.DirectionalLight(0x2d1840, 0.4);
    dirLight.position.set(10, 20, 10);
    this.scene.add(dirLight);
  }

  addFlickerLight(position, color = 0xff6600, intensity = 2.0, distance = 9) {
    const light = new THREE.PointLight(color, intensity, distance, 2.0);
    light.position.copy(position);
    light.castShadow = !this.isMobile;
    if (light.castShadow) {
      light.shadow.mapSize.width = 512;
      light.shadow.mapSize.height = 512;
      light.shadow.bias = -0.002;
    }
    this.scene.add(light);

    // Visual bulb mesh
    const bulbGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const bulbMat = new THREE.MeshBasicMaterial({ color: color });
    const bulbMesh = new THREE.Mesh(bulbGeo, bulbMat);
    bulbMesh.position.copy(position);
    this.scene.add(bulbMesh);

    this.flickerLights.push({
      light,
      bulbMesh,
      baseIntensity: intensity,
      seed: Math.random() * 100,
      flickerSpeed: 3 + Math.random() * 5
    });

    return light;
  }

  update(delta) {
    const time = this.clock.getElapsedTime();

    // Horror light flickering
    for (const fl of this.flickerLights) {
      // Noise flicker with sudden short dropouts
      const noise = Math.sin(time * fl.flickerSpeed + fl.seed) * Math.cos(time * (fl.flickerSpeed * 1.7));
      const glitch = Math.random() < 0.03 ? 0.1 : 1.0;
      const targetIntensity = fl.baseIntensity * (0.8 + 0.35 * noise) * glitch;
      fl.light.intensity = THREE.MathUtils.lerp(fl.light.intensity, targetIntensity, 0.4);
      fl.bulbMesh.material.color.setScalar(fl.light.intensity / fl.baseIntensity);
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

