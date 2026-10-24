/**
 * LUXURY 3D CAR SHOWROOM & INTERACTIVE PORTFOLIO ENGINE
 * Built with Three.js, Lucide, Web Audio API & GSAP
 * Featuring Ported Unity 'XR500 Flop Metallic Shader' & WebGL Live Demo Integration
 */

// Global State
const ShowroomState = {
  // Unity Flop Shader Parameters
  flopEnabled: true,
  baseColor: '#d81422',      // Candy Red default
  flopColor: '#4a030a',      // Deep Burgundy default
  flopFalloff: 2.5,
  flopIntensity: 2.2,        // Flop edge glancing strength boost
  highlightComp: 1.0,
  clearcoatStrength: 0.95,
  clearcoatRoughness: 0.05,
  metalness: 0.88,
  roughness: 0.16,

  // Developer Debug Mode (Restricted for creator, locked for regular visitors)
  devMode: false,

  // Environment & Studio
  currentLight: 'studio',
  autoRotate: true,
  wireframe: false,
  headlightsOn: true,
  audioPlaying: false,
};

let scene, camera, renderer, controls, composer;
let carGroup, carBodyMaterials = [], lightMeshMaterials = [];
let studioLights = {};
let audioCtx = null, engineGain = null, engineOsc = null;

// Initialize on DOM Loaded
document.addEventListener('DOMContentLoaded', () => {
  initThreeShowroom();
  initProjectsGrid();
  initShowroomControls();
  initVehicleSelector();
  initFlopShaderControls();
  initCustomModelLoader();
  initAudioSynthesizer();
  initDemoModal();
  initMaterialInspector();
});

/* =========================================================================
   1. THREE.JS 3D CAR SHOWROOM SETUP
   ========================================================================= */
function initThreeShowroom() {
  const container = document.getElementById('canvas-container');
  if (!container) return;

  const width = container.clientWidth || window.innerWidth || 1280;
  const height = container.clientHeight || window.innerHeight || 720;

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x08080a);
  scene.fog = new THREE.FogExp2(0x08080a, 0.04);

  // Camera
  camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(5.5, 2.2, 5.8);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.78; // Calibrated exposure matching actual Substance Iray render
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // High-End Post-Processing Pipeline (Pinpoint Glare, Pure Contrast)
  try {
    const renderPass = new THREE.RenderPass(scene, camera);
    const bloomPass = new THREE.UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.15,  // Subtle pinpoint bloom
      0.20,  // Tight radius
      0.95   // Strictly target chrome & lamp speculars only
    );

    composer = new THREE.EffectComposer(renderer);
    composer.addPass(renderPass);
    composer.addPass(bloomPass);
  } catch (e) {
    console.warn("Post-processing fallback to standard pipeline:", e);
    composer = null;
  }

  // Orbit Controls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = Math.PI / 2 - 0.02; // Don't go below floor
  controls.minDistance = 2.5;
  controls.maxDistance = 14;
  controls.autoRotate = ShowroomState.autoRotate;
  controls.autoRotateSpeed = 1.2;
  controls.target.set(0, 0.5, 0);

  // Studio Lighting
  setupShowroomLighting();

  // Showroom Floor & Stage
  createShowroomFloor();

  // Load Initial Vehicle (Bentley GLB or Procedural Hypercar)
  const selectElem = document.getElementById('vehicle-select');
  if (selectElem && selectElem.value === 'bentley') {
    loadBentleyModel();
  } else {
    createProceduralHypercar();
  }

  // Resize Listener
  window.addEventListener('resize', onWindowResize);

  // Animation Loop
  animate();
}

/* =========================================================================
   2. UNITY FLOP METALLIC SHADER (ROBUST PBR ENGINE)
   ========================================================================= */
function createFlopMetallicMaterial() {
  // Ultra-robust Physical Metallic Paint Material
  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(ShowroomState.baseColor),
    metalness: ShowroomState.metalness,
    roughness: ShowroomState.roughness,
    clearcoat: ShowroomState.clearcoatStrength,
    clearcoatRoughness: ShowroomState.clearcoatRoughness,
    reflectivity: 0.95,
  });

  return mat;
}

function updateFlopShaderParameters() {
  const selectElem = document.getElementById('vehicle-select');
  const currentVehicle = selectElem ? selectElem.value : 'concept';

  // 1. All real fleet vehicles preserve authentic Substance Painter baked PBR textures (Flop disabled)
  if (currentVehicle !== 'concept') {
    carBodyMaterials.forEach((mat) => {
      if (mat && mat.userData && mat.userData.flopUniforms) {
        mat.userData.flopUniforms.uFlopEnabled.value = 0.0; // 순정 PBR 보존 (Region Mask 셰이더 대기)
      }
      if (mat && mat.color) {
        mat.color.setHex(0xffffff); // 100% true baked albedo color preservation
        mat.needsUpdate = true;
      }
    });

    if (studioLights && studioLights.rimLight) {
      studioLights.rimLight.color.setHex(0xb0bccb);
      studioLights.rimLight.intensity = 0.60;
    }
    return;
  }

  carBodyMaterials.forEach((mat) => {
    if (mat) {
      if (mat.color) {
        mat.color.set(ShowroomState.baseColor);
      }
      if (mat.metalness !== undefined) {
        mat.metalness = ShowroomState.metalness;
      }
      if (mat.roughness !== undefined) {
        mat.roughness = ShowroomState.roughness;
      }
      if (mat.clearcoat !== undefined) {
        mat.clearcoat = ShowroomState.clearcoatStrength;
      }
      if (mat.clearcoatRoughness !== undefined) {
        mat.clearcoatRoughness = ShowroomState.clearcoatRoughness;
      }
      mat.needsUpdate = true;
    }
  });

  // Dynamic Studio Rim Light updates to simulate Flop Tint at glance angle!
  if (studioLights && studioLights.rimLight) {
    if (ShowroomState.flopEnabled) {
      studioLights.rimLight.color.set(ShowroomState.flopColor);
      const intensity = (ShowroomState.flopIntensity !== undefined ? ShowroomState.flopIntensity : 2.2);
      studioLights.rimLight.intensity = intensity * (ShowroomState.flopFalloff / 2.0);
    } else {
      studioLights.rimLight.color.setHex(0x90b0ff);
      studioLights.rimLight.intensity = 1.8;
    }
  }
}

/* =========================================================================
   3. SUBSTANCE IRAY STUDIO ENVIRONMENT & LIGHTING
   ========================================================================= */
let irayEnvTexture = null;

function createIrayStudioBackground() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Substance Iray High-Contrast Muted Studio Cyclorama
  // Top: Deep Charcoal Slate (#141518) -> Horizon: Subdued Studio Wall (#383a42) -> Floor: Low-Key Matte Grey (#6b6d76)
  const grad = ctx.createLinearGradient(0, 0, 0, 1024);
  grad.addColorStop(0.0, '#141518');  // Deep dark upper ceiling / void
  grad.addColorStop(0.20, '#222328'); // Upper studio backdrop
  grad.addColorStop(0.42, '#383a42'); // Upper horizon
  grad.addColorStop(0.55, '#4b4d56'); // Horizon soft blend
  grad.addColorStop(0.72, '#5c5e67'); // Low-key floor ramp
  grad.addColorStop(1.0, '#6b6d76');  // Subdued matte studio floor (Toned down, zero eye-strain glare)
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  // Studio Corner Vignette for authentic Iray contrast
  const vignette = ctx.createRadialGradient(512, 530, 180, 512, 530, 750);
  vignette.addColorStop(0, 'rgba(255,255,255,0.0)');
  vignette.addColorStop(0.65, 'rgba(0,0,0,0.20)');
  vignette.addColorStop(1.0, 'rgba(0,0,0,0.50)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, 1024, 1024);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

function createIrayReflectionProbe() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Studio Ambient Dome (Neutral Low-Key Base)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, 512);
  bgGrad.addColorStop(0, '#18191e');
  bgGrad.addColorStop(0.5, '#2e3037');
  bgGrad.addColorStop(1, '#464852');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1024, 512);

  // Softbox 1: Overhead Main Key Light (Broad Studio Softbox)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillRect(180, 50, 260, 130);

  // Softbox 2: Front Fill Softbox
  ctx.fillStyle = 'rgba(235, 242, 255, 0.65)';
  ctx.fillRect(600, 70, 200, 100);

  // Softbox 3: Top Rim Strip
  ctx.fillStyle = 'rgba(220, 230, 245, 0.50)';
  ctx.fillRect(50, 15, 924, 20);

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  return texture;
}

function setupShowroomLighting() {
  // Apply Exact Iray Studio Background & Reflections
  const irayBg = createIrayStudioBackground();
  scene.background = irayBg;
  scene.fog = new THREE.Fog(0x383a42, 18, 55);

  irayEnvTexture = createIrayReflectionProbe();

  // High-End PMREM Pre-filtered Radiance Environment Map (Iray Reflection Quality)
  if (renderer) {
    try {
      const pmrem = new THREE.PMREMGenerator(renderer);
      pmrem.compileEquirectangularShader();
      const envTarget = pmrem.fromEquirectangular(irayEnvTexture);
      scene.environment = envTarget.texture;
    } catch (e) {
      scene.environment = irayEnvTexture;
    }
  } else {
    scene.environment = irayEnvTexture;
  }

  // 1. Natural Hemisphere Light (Calibrated for deep contrast without washing out)
  const hemiLight = new THREE.HemisphereLight(0xb5b9c2, 0x1c1e24, 0.38);
  hemiLight.position.set(0, 20, 0);
  scene.add(hemiLight);
  studioLights.hemi = hemiLight;

  // 2. Main Softbox Key Light (Produces authentic Iray car body shadows)
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.10);
  keyLight.position.set(4.0, 7.5, 3.5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.bias = -0.0004;
  keyLight.shadow.radius = 3.0;
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 20;
  keyLight.shadow.camera.left = -5;
  keyLight.shadow.camera.right = 5;
  keyLight.shadow.camera.top = 5;
  keyLight.shadow.camera.bottom = -5;
  scene.add(keyLight);
  studioLights.keyLight = keyLight;

  // 3. Front Key Fill Light (Illuminates Grille, Headlights, Front Bumper)
  const frontFill = new THREE.DirectionalLight(0xffffff, 0.45);
  frontFill.position.set(-3.5, 3.0, 5.0);
  scene.add(frontFill);
  studioLights.frontFill = frontFill;

  // 4. Subtle Rim Contour Light
  const rimLight = new THREE.DirectionalLight(0xb0bccb, 0.60);
  rimLight.position.set(-5, 4.0, -4.5);
  scene.add(rimLight);
  studioLights.rimLight = rimLight;
}

function updateLightingMode(mode) {
  ShowroomState.currentLight = mode;
  if (mode === 'studio') {
    // Iray Neutral Studio (Default)
    scene.background = createIrayStudioBackground();
    scene.environment = irayEnvTexture;
    scene.fog.color.setHex(0x383a42);
    studioLights.hemi.color.setHex(0xb5b9c2);
    studioLights.hemi.groundColor.setHex(0x1c1e24);
    studioLights.hemi.intensity = 0.38;
    studioLights.keyLight.color.setHex(0xffffff);
    studioLights.keyLight.intensity = 1.10;
    studioLights.frontFill.color.setHex(0xffffff);
    studioLights.frontFill.intensity = 0.45;
    studioLights.rimLight.color.setHex(0xb0bccb);
    studioLights.rimLight.intensity = 0.60;
  } else if (mode === 'cyber') {
    scene.background = new THREE.Color(0x060913);
    scene.fog.color.setHex(0x060913);
    studioLights.hemi.color.setHex(0x00f0ff);
    studioLights.hemi.groundColor.setHex(0x1a0033);
    studioLights.hemi.intensity = 0.65;
    studioLights.keyLight.color.setHex(0x00f0ff);
    studioLights.keyLight.intensity = 2.2;
    studioLights.frontFill.color.setHex(0xff0077);
    studioLights.frontFill.intensity = 1.5;
    studioLights.rimLight.color.setHex(0xff00aa);
    studioLights.rimLight.intensity = 2.4;
  } else if (mode === 'sunset') {
    scene.background = new THREE.Color(0x1a120e);
    scene.fog.color.setHex(0x1a120e);
    studioLights.hemi.color.setHex(0xffd5a0);
    studioLights.hemi.groundColor.setHex(0x3a2015);
    studioLights.hemi.intensity = 0.75;
    studioLights.keyLight.color.setHex(0xff9944);
    studioLights.keyLight.intensity = 2.0;
    studioLights.frontFill.color.setHex(0xffb870);
    studioLights.frontFill.intensity = 1.2;
    studioLights.rimLight.color.setHex(0xff4422);
    studioLights.rimLight.intensity = 1.8;
  }
}

/* =========================================================================
   4. SEAMLESS IRAY STUDIO FLOOR (CONTACT SHADOW GROUND)
   ========================================================================= */
function createShowroomFloor() {
  // 1. Transparent Shadow Receiver Floor (Seamless Cyclorama)
  const floorGeo = new THREE.PlaneGeometry(80, 80);
  const floorMat = new THREE.ShadowMaterial({
    opacity: 0.52, // Solid, authentic grounding contact shadow on muted floor
  });
  const shadowFloor = new THREE.Mesh(floorGeo, floorMat);
  shadowFloor.rotation.x = -Math.PI / 2;
  shadowFloor.position.y = 0.001;
  shadowFloor.receiveShadow = true;
  scene.add(shadowFloor);

  // 2. Soft Ambient Occlusion Contact Shadow directly under wheels and chassis
  const contactCanvas = document.createElement('canvas');
  contactCanvas.width = 512;
  contactCanvas.height = 512;
  const cctx = contactCanvas.getContext('2d');
  const blobGrad = cctx.createRadialGradient(256, 256, 30, 256, 256, 230);
  blobGrad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
  blobGrad.addColorStop(0.45, 'rgba(0, 0, 0, 0.30)');
  blobGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
  cctx.fillStyle = blobGrad;
  cctx.fillRect(0, 0, 512, 512);

  const contactTex = new THREE.CanvasTexture(contactCanvas);
  const contactGeo = new THREE.PlaneGeometry(5.4, 3.0);
  const contactMat = new THREE.MeshBasicMaterial({
    map: contactTex,
    transparent: true,
    depthWrite: false,
    opacity: 0.85,
  });
  const contactMesh = new THREE.Mesh(contactGeo, contactMat);
  contactMesh.rotation.x = -Math.PI / 2;
  contactMesh.position.y = 0.002;
  scene.add(contactMesh);
}

/* =========================================================================
   5. PROCEDURAL HIGH-END HYPERCAR GEOMETRY
   ========================================================================= */
function createProceduralHypercar() {
  carGroup = new THREE.Group();
  carGroup.name = "HypercarRoot";
  carBodyMaterials = [];
  lightMeshMaterials = [];

  // Create Flop Material
  const bodyPaintMat = createFlopMetallicMaterial();
  carBodyMaterials.push(bodyPaintMat);

  const carbonMat = new THREE.MeshStandardMaterial({
    color: 0x151618,
    roughness: 0.35,
    metalness: 0.5
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x111622,
    metalness: 0.1,
    roughness: 0.04,
    transmission: 0.88,
    transparent: true,
    opacity: 0.88,
    ior: 1.52
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xd8dbe0,
    metalness: 0.95,
    roughness: 0.1
  });

  const tireRubberMat = new THREE.MeshStandardMaterial({
    color: 0x111112,
    roughness: 0.85,
    metalness: 0.05
  });

  const caliperMat = new THREE.MeshStandardMaterial({
    color: 0xd92525,
    metalness: 0.6,
    roughness: 0.2
  });

  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x88ccff,
    emissiveIntensity: 3.5,
    roughness: 0.1
  });
  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xff1133,
    emissive: 0xff002b,
    emissiveIntensity: 4.0,
    roughness: 0.1
  });
  lightMeshMaterials.push(headlightMat, taillightMat);

  // 1. Lower Chassis
  const chassisGeo = new THREE.BoxGeometry(2.1, 0.2, 4.4);
  const chassis = new THREE.Mesh(chassisGeo, carbonMat);
  chassis.position.set(0, 0.25, 0);
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  carGroup.add(chassis);

  // Front Carbon Splitter
  const splitterGeo = new THREE.BoxGeometry(2.15, 0.05, 0.6);
  const splitter = new THREE.Mesh(splitterGeo, carbonMat);
  splitter.position.set(0, 0.12, 2.3);
  splitter.castShadow = true;
  carGroup.add(splitter);

  // Rear Aero Diffuser
  const diffuserGeo = new THREE.BoxGeometry(2.1, 0.25, 0.6);
  const diffuser = new THREE.Mesh(diffuserGeo, carbonMat);
  diffuser.position.set(0, 0.22, -2.25);
  diffuser.rotation.x = -0.2;
  diffuser.castShadow = true;
  carGroup.add(diffuser);

  // 2. Main Aerodynamic Body Shell
  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(-2.3, 0.15);
  bodyShape.lineTo(-2.2, 0.55);
  bodyShape.lineTo(-1.6, 0.72);
  bodyShape.lineTo(-0.8, 1.05);
  bodyShape.lineTo(0.1, 1.12);
  bodyShape.lineTo(0.9, 0.88);
  bodyShape.lineTo(1.8, 0.52);
  bodyShape.lineTo(2.35, 0.32);
  bodyShape.lineTo(2.35, 0.18);
  bodyShape.lineTo(1.9, 0.15);
  bodyShape.lineTo(-2.3, 0.15);

  const extrudeSettings = {
    steps: 2,
    depth: 1.95,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.08,
    bevelSegments: 4
  };

  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, extrudeSettings);
  bodyGeo.rotateY(Math.PI / 2);
  bodyGeo.translate(0.975, 0.1, 0);

  const carBodyMesh = new THREE.Mesh(bodyGeo, bodyPaintMat);
  carBodyMesh.castShadow = true;
  carBodyMesh.receiveShadow = true;
  carGroup.add(carBodyMesh);

  // 3. Cabin Glass Canopy
  const canopyGeo = new THREE.BoxGeometry(1.68, 0.58, 1.85);
  const canopy = new THREE.Mesh(canopyGeo, glassMat);
  canopy.position.set(0, 0.95, -0.15);
  canopy.rotation.x = -0.14;
  canopy.castShadow = true;
  carGroup.add(canopy);

  // 4. Side Mirrors
  [-1.02, 1.02].forEach((xSide) => {
    const mirrorStem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.18), carbonMat);
    mirrorStem.position.set(xSide, 0.8, 0.65);
    mirrorStem.rotation.z = xSide * 0.4;
    carGroup.add(mirrorStem);

    const mirrorHead = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.1, 0.12), bodyPaintMat);
    mirrorHead.position.set(xSide * 1.12, 0.86, 0.65);
    mirrorHead.castShadow = true;
    carGroup.add(mirrorHead);
  });

  // 5. LED Headlights
  [-0.72, 0.72].forEach((xSide) => {
    const lightGeo = new THREE.BoxGeometry(0.35, 0.06, 0.2);
    const lightMesh = new THREE.Mesh(lightGeo, headlightMat);
    lightMesh.position.set(xSide, 0.52, 2.15);
    lightMesh.rotation.y = xSide * 0.3;
    carGroup.add(lightMesh);
  });

  // 6. Horizon LED Taillight Bar
  const tailGeo = new THREE.BoxGeometry(1.85, 0.06, 0.08);
  const taillight = new THREE.Mesh(tailGeo, taillightMat);
  taillight.position.set(0, 0.64, -2.24);
  carGroup.add(taillight);

  // 7. Active Rear Aerodynamic Wing
  const wingBladeGeo = new THREE.BoxGeometry(1.9, 0.04, 0.38);
  const wingBlade = new THREE.Mesh(wingBladeGeo, carbonMat);
  wingBlade.position.set(0, 0.96, -2.1);
  wingBlade.rotation.x = -0.12;
  wingBlade.castShadow = true;
  carGroup.add(wingBlade);

  [-0.55, 0.55].forEach((xPillar) => {
    const pillarGeo = new THREE.BoxGeometry(0.04, 0.3, 0.12);
    const pillar = new THREE.Mesh(pillarGeo, carbonMat);
    pillar.position.set(xPillar, 0.82, -2.05);
    carGroup.add(pillar);
  });

  // 8. 4x High-End Sport Wheels
  const wheelPositions = [
    { x: -1.04, y: 0.38, z: 1.45, isFront: true },
    { x: 1.04, y: 0.38, z: 1.45, isFront: true },
    { x: -1.05, y: 0.40, z: -1.45, isFront: false },
    { x: 1.05, y: 0.40, z: -1.45, isFront: false }
  ];

  wheelPositions.forEach((pos) => {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(pos.x, pos.y, pos.z);

    const tireRadius = pos.isFront ? 0.38 : 0.40;
    const tireWidth = pos.isFront ? 0.28 : 0.36;
    const tireGeo = new THREE.CylinderGeometry(tireRadius, tireRadius, tireWidth, 32);
    const tire = new THREE.Mesh(tireGeo, tireRubberMat);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    wheelGroup.add(tire);

    const rimGeo = new THREE.CylinderGeometry(tireRadius * 0.72, tireRadius * 0.72, tireWidth * 1.02, 24);
    const rim = new THREE.Mesh(rimGeo, chromeMat);
    rim.rotation.z = Math.PI / 2;
    wheelGroup.add(rim);

    const spokeCount = 5;
    for (let s = 0; s < spokeCount; s++) {
      const angle = (s / spokeCount) * Math.PI * 2;
      const spokeGeo = new THREE.BoxGeometry(0.04, tireRadius * 0.65, tireWidth * 0.95);
      const spoke = new THREE.Mesh(spokeGeo, chromeMat);
      spoke.rotation.x = angle;
      wheelGroup.add(spoke);
    }

    const discGeo = new THREE.CylinderGeometry(tireRadius * 0.55, tireRadius * 0.55, 0.03, 24);
    const disc = new THREE.Mesh(discGeo, chromeMat);
    disc.rotation.z = Math.PI / 2;
    wheelGroup.add(disc);

    const caliperGeo = new THREE.BoxGeometry(0.08, 0.16, 0.12);
    const caliper = new THREE.Mesh(caliperGeo, caliperMat);
    caliper.position.set((pos.x > 0 ? -1 : 1) * 0.05, 0.12, 0);
    wheelGroup.add(caliper);

    carGroup.add(wheelGroup);
  });

  scene.add(carGroup);

  // Register Concept GT materials for Material Inspector
  activeCarKey = 'concept';
  activeCarMaterials = {
    'Mat_Flop_Paint': bodyPaintMat,
    'Mat_Carbon_Aero': carbonMat,
    'Mat_Cockpit_Glass': glassMat,
    'Mat_Chrome': chromeMat,
    'Mat_Tires': tireRubberMat,
    'Mat_Caliper': caliperMat
  };
  if (typeof renderMaterialInspector === 'function') renderMaterialInspector();
}

/* =========================================================================
   5-1. ACTUAL USER 3D MODELS (BENTLEY TURBO R & LAMBORGHINI AVENTADOR)
   ========================================================================= */
let cachedModels = {};

function initVehicleSelector() {
  const selectElem = document.getElementById('vehicle-select');
  const fixedHint = document.getElementById('vehicle-fixed-hint');
  const flopBanner = document.getElementById('flop-disabled-banner');
  const flopWrapper = document.getElementById('flop-controls-wrapper');
  if (!selectElem) return;

  const handleVehicleChange = (val) => {
    if (val === 'concept') {
      if (fixedHint) fixedHint.classList.add('hidden');
      if (flopBanner) flopBanner.classList.add('hidden');
      if (flopWrapper) {
        flopWrapper.classList.remove('opacity-40', 'pointer-events-none');
      }
      if (carGroup) scene.remove(carGroup);
      createProceduralHypercar();
      updateFlopShaderParameters();
    } else if (val === 'bentley') {
      if (fixedHint) fixedHint.classList.remove('hidden');
      if (flopBanner) flopBanner.classList.remove('hidden');
      if (flopWrapper) {
        flopWrapper.classList.add('opacity-40', 'pointer-events-none');
      }
      loadBentleyModel();
    } else {
      // Real Maya & Substance Painter Fleet (Lambo, Bugatti, Shelby GT500, Spano, Stinger, SVR, Cobalt, Spark, Golf)
      if (fixedHint) fixedHint.classList.remove('hidden');
      if (flopBanner) flopBanner.classList.remove('hidden');
      if (flopWrapper) {
        flopWrapper.classList.add('opacity-40', 'pointer-events-none');
      }
      loadFleetVehicle(val);
    }
  };

  selectElem.addEventListener('change', (e) => {
    handleVehicleChange(e.target.value);
  });

  // Apply initial vehicle state to UI
  if (flopBanner) flopBanner.classList.remove('hidden');
  if (flopWrapper) flopWrapper.classList.add('opacity-40', 'pointer-events-none');
}

function showShowroomLoading(text = "3D 모델 및 2K URP 텍스처 로딩 중...") {
  let spinner = document.getElementById('showroom-loader');
  if (!spinner) {
    spinner = document.createElement('div');
    spinner.id = 'showroom-loader';
    spinner.className = 'absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 pointer-events-none';
    spinner.innerHTML = `
      <div class="spinner mb-3"></div>
      <div id="showroom-loader-text" class="text-xs font-mono text-showroom-gold uppercase tracking-wider font-semibold"></div>
    `;
    const container = document.getElementById('canvas-container');
    if (container) container.appendChild(spinner);
  }
  const textElem = document.getElementById('showroom-loader-text');
  if (textElem) textElem.textContent = text;
  spinner.style.opacity = '1';
  spinner.style.display = 'flex';
}

function hideShowroomLoading() {
  const spinner = document.getElementById('showroom-loader');
  if (spinner) {
    spinner.style.opacity = '0';
    setTimeout(() => { spinner.style.display = 'none'; }, 300);
  }
}

function loadBentleyModel() {
  if (carGroup) scene.remove(carGroup);
  showShowroomLoading("1993 Bentley Turbo R 3D GLB 로딩 중...");

  const loader = new THREE.GLTFLoader();

  loader.load(
    'assets/models/bentley/bentley.glb',
    (gltf) => {
      const model = gltf.scene;

      carBodyMaterials = []; // Strictly isolated: do not register Bentley to Flop paint mutator
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          // Preserve Substance Painter PBR materials with clear reflections
          if (child.material) {
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach((m) => {
              m.envMapIntensity = 1.15; // Natural realistic reflection on clearcoat & chrome (no blow-out)
              m.needsUpdate = true;
              // Bentley materials are kept pristine, never pushed to carBodyMaterials
            });
          }
        }
      });

      // Reset rim light to neutral studio light for Bentley
      if (studioLights && studioLights.rimLight) {
        studioLights.rimLight.color.setHex(0xb0bccb);
        studioLights.rimLight.intensity = 0.60;
      }

      // Precise Bounding Box Normalization & Grounding on Showroom Stage
      model.position.set(0, 0, 0);
      const initialBox = new THREE.Box3().setFromObject(model);
      const size = initialBox.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scaleFactor = 4.4 / (maxDim > 0 ? maxDim : 1);
      model.scale.setScalar(scaleFactor);
      model.updateMatrixWorld(true);

      const scaledBox = new THREE.Box3().setFromObject(model);
      const scaledCenter = scaledBox.getCenter(new THREE.Vector3());

      model.position.x = -scaledCenter.x;
      model.position.z = -scaledCenter.z;
      model.position.y = -scaledBox.min.y; // Sit perfectly on the reflective floor
      model.updateMatrixWorld(true);

      carGroup = model;
      scene.add(carGroup);

      // Register Bentley materials for Material Inspector
      activeCarKey = 'bentley';
      const bentleyMats = {};
      model.traverse((child) => {
        if (child.isMesh && child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((m, idx) => {
            const key = m.name || `Bentley_Part_${idx}`;
            bentleyMats[key] = m;
          });
        }
      });
      activeCarMaterials = bentleyMats;
      if (typeof renderMaterialInspector === 'function') renderMaterialInspector();

      hideShowroomLoading();
    },
    (progress) => {
      if (progress.total > 0) {
        const pct = Math.round((progress.loaded / progress.total) * 100);
        showShowroomLoading(`1993 Bentley Turbo R 로딩 중... (${pct}%)`);
      }
    },
    (err) => {
      console.error("Bentley GLB Load Error:", err);
      hideShowroomLoading();
      alert(`Bentley GLB 로드 실패: ${err.message}`);
    }
  );
}

const FLEET_TITLES = {
  bentley: "1993 Bentley Turbo R",
  lambo: "2012 Lamborghini Aventador LP700-4",
  bugatti: "2015 Bugatti Veyron 16.4 Coupe",
  mustang: "2013 Ford Mustang Shelby GT500",
  spano: "2016 GTA Spano",
  stinger: "2018 Kia Stinger GT 3.3T AWD",
  svr: "2020 Range Rover Sport SVR",
  cobalt: "2012 Chevy Cobalt SS FWD Pro",
  spark: "2010 Chevy Spark M300",
  golf: "2012 Volkswagen Golf GTi"
};

let cachedFleetManifest = null;

async function loadFleetVehicle(carKey) {
  if (carGroup) scene.remove(carGroup);
  const title = FLEET_TITLES[carKey] || carKey.toUpperCase();
  showShowroomLoading(`${title} 3D 메시 및 2K PBR 텍스처 로딩 중...`);

  try {
    if (!cachedFleetManifest) {
      const mRes = await fetch('assets/models/fleet_manifest.json');
      if (mRes.ok) {
        cachedFleetManifest = await mRes.json();
      }
    }

    const carData = cachedFleetManifest ? cachedFleetManifest[carKey] : null;
    if (!carData) {
      throw new Error(`차량 데이터를 찾을 수 없습니다: ${carKey}`);
    }

    const carDir = `assets/models/${carKey}`;
    const texLoader = new THREE.TextureLoader();

    const loadPBRTexture = (filename, isColor = false) => {
      if (!filename) return null;
      const tex = texLoader.load(`${carDir}/${filename}`);
      tex.flipY = true; // WebGL / Three.js standard orientation
      if (isColor) tex.encoding = THREE.sRGBEncoding;
      return tex;
    };

    // Material Map for this vehicle
    const materialMap = {};
    const bodyMaterials = [];
    const savedMatSettings = getVehicleSavedMaterialSettings(carKey);

    const matKeys = Object.keys(carData.materials || {});
    for (const mKey of matKeys) {
      const mInfo = carData.materials[mKey];
      const keyLower = mKey.toLowerCase();

      // For brake disc rotors converted from Maya Specular workflow, baseColor is black (diffuse 0),
      // while specular contains the silver metal reflectance (196, 199, 199).
      // Three.js MeshStandardMaterial (Metallic workflow) requires metal reflectance in map/color.
      const baseColorFile = (keyLower.includes('disc') && !keyLower.includes('hot') && mInfo.specular) ? mInfo.specular : mInfo.baseColor;
      const albedoTex = loadPBRTexture(baseColorFile, true);
      const normalTex = loadPBRTexture(mInfo.normal, false);
      const roughTex = loadPBRTexture(mInfo.roughness, false);
      const metalTex = loadPBRTexture(mInfo.metallic, false);
      const emissTex = loadPBRTexture(mInfo.emissive, true);
      const opacityTex = loadPBRTexture(mInfo.opacity, false);

      const isRimMat = keyLower.includes('rim');
      const isTireMat = keyLower.includes('wheel') || keyLower.includes('tire');
      const isBrakeMat = keyLower.includes('caliper') || keyLower.includes('disc');
      const isBodyMat = keyLower.includes('body') || keyLower.includes('base');

      const mat = new THREE.MeshStandardMaterial({
        name: mKey,
        map: albedoTex,
        normalMap: normalTex,
        roughnessMap: roughTex,
        metalnessMap: metalTex,
        emissiveMap: emissTex,
        emissive: emissTex ? 0xffffff : 0x000000,
        emissiveIntensity: emissTex ? 1.2 : 0,
        metalness: isRimMat ? 0.95 : (isBrakeMat ? 0.85 : (isTireMat ? 0.1 : 0.88)),
        roughness: isRimMat ? 0.12 : (isBrakeMat ? 0.25 : (isTireMat ? 0.85 : 0.18)),
        envMapIntensity: 1.15
      });

      mat.userData = mat.userData || {};
      mat.userData.origAlphaMap = opacityTex || null;
      mat.userData.origAlbedo = albedoTex || null;

      // 3-Channel Unity Region Mask integration (R=Body Paint, G=Livery, B=Emblem/Logo)
      if (mInfo.regionMask) {
        const regionMaskTex = loadPBRTexture(mInfo.regionMask, false);
        mat.userData.regionMask = regionMaskTex;
        const flopUniforms = {
          uRegionMask: { value: regionMaskTex },
          uFlopEnabled: { value: 0.0 }, // 기본 비활성화: 순정 Substance Painter PBR 베이크 보존 (Region Mask 셰이더 대기)
          uPaintColor: { value: new THREE.Color(ShowroomState.baseColor || '#d81422') },
          uFlopColor: { value: new THREE.Color(ShowroomState.flopColor || '#4a030a') },
          uFlopFalloff: { value: ShowroomState.flopFalloff !== undefined ? ShowroomState.flopFalloff : 2.5 },
          uFlopIntensity: { value: ShowroomState.flopIntensity !== undefined ? ShowroomState.flopIntensity : 2.2 },
          uSourceLuminance: { value: 0.58 } // Lamborghini baked orange albedo luminance reference
        };
        mat.userData.flopUniforms = flopUniforms;

        mat.onBeforeCompile = (shader) => {
          Object.assign(shader.uniforms, flopUniforms);
          shader.fragmentShader = `
            uniform sampler2D uRegionMask;
            uniform float uFlopEnabled;
            uniform vec3 uPaintColor;
            uniform vec3 uFlopColor;
            uniform float uFlopFalloff;
            uniform float uFlopIntensity;
            uniform float uSourceLuminance;
          \n` + shader.fragmentShader;

          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <map_fragment>',
            `#include <map_fragment>
            if (uFlopEnabled > 0.5) {
              vec4 maskSample = texture2D(uRegionMask, vUv);
              float bodyMask = maskSample.r;
              if (bodyMask > 0.02) {
                vec3 viewDir = normalize(-vViewPosition);
                vec3 norm = normalize(vNormal);
                float NdotV = max(dot(norm, viewDir), 0.0);
                float fresnel = pow(clamp(1.0 - NdotV, 0.0, 1.0), uFlopFalloff);
                vec3 blendedPaint = mix(uPaintColor, uFlopColor, clamp(fresnel * uFlopIntensity, 0.0, 1.0));

                float origLum = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
                float detail = origLum / max(uSourceLuminance, 0.01);
                vec3 recolored = blendedPaint * detail;

                diffuseColor.rgb = mix(diffuseColor.rgb, recolored, bodyMask);
              }
            }`
          );
        };
      }

      // Determine initial setting from saved local storage, vehicle defaults, or smart inference
      const defaultTable = FLEET_DEFAULT_MAT_SETTINGS[carKey] || {};
      const setting = savedMatSettings[keyLower] ||
                      defaultTable[keyLower] ||
                      inferDefaultMaterialSetting(keyLower, opacityTex);

      applySingleMaterialSetting(mat, setting);

      materialMap[keyLower] = mat;
      materialMap[mKey] = mat;

      if (isBodyMat) {
        bodyMaterials.push(mat);
      }
    }

    carBodyMaterials = bodyMaterials;

    // Fetch and parse FBX
    const fbxPath = `${carDir}/${carData.fbx}`;
    const res = await fetch(fbxPath);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const buffer = await res.arrayBuffer();

    const loader = new THREE.FBXLoader();
    const fbx = loader.parse(buffer, '');

    const resolveSingleMaterial = (origMatName, meshName) => {
      let raw = (origMatName || '').toLowerCase().replace(/_mayapbr$/, '').replace(/_implementation$/, '').trim();
      if (raw.startsWith('material::')) raw = raw.substring(10);

      // 1. Direct key match (case-insensitive)
      for (const [k, m] of Object.entries(materialMap)) {
        if (k.toLowerCase() === raw) return m;
      }

      // 2. Normalized alphanumeric match (ignores underscores/spaces/hyphens)
      const normRaw = raw.replace(/[^a-z0-9]/g, '');
      for (const [k, m] of Object.entries(materialMap)) {
        const normKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (normKey === normRaw) return m;
      }

      // 3. Strict opacity awareness (disallow matching opaque mesh to opacity material or vice versa)
      const hasOpTag = normRaw.includes('op') || normRaw.includes('opacity') || normRaw.includes('glass') || normRaw.includes('cover') || normRaw.includes('louver');
      
      for (const [k, m] of Object.entries(materialMap)) {
        const normKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        const candHasOp = normKey.includes('op') || normKey.includes('opacity') || normKey.includes('glass') || normKey.includes('cover') || normKey.includes('louver');
        if (hasOpTag !== candHasOp) continue;

        if (normKey.includes(normRaw) || normRaw.includes(normKey)) {
          return m;
        }
      }

      // 4. Token-based fallback with strict Opacity awareness
      if (normRaw.includes('body2')) return materialMap['mat_body_2'] || materialMap['mat_body2'] || materialMap['mat_body'] || Object.values(materialMap)[0];
      if (normRaw.includes('body1') || normRaw.includes('body01')) return materialMap['mat_body1'] || materialMap['mat_body_01'] || materialMap['mat_body'] || Object.values(materialMap)[0];
      if (normRaw.includes('body')) return materialMap['mat_body'] || materialMap['mat_body1'] || materialMap['mat_base'] || Object.values(materialMap)[0];
      if (normRaw.includes('louver')) return materialMap['mat_louver_opacity'] || materialMap['mat_louver'] || Object.values(materialMap)[0];
      if (normRaw.includes('headlight') && hasOpTag) return materialMap['mat_headlight_cover_opacity'] || materialMap['mat_headlight_cover_op'] || materialMap['mat_headlight_op'] || Object.values(materialMap)[0];
      if (normRaw.includes('extra') && hasOpTag) return materialMap['mat_extra_op'] || Object.values(materialMap)[0];
      if (normRaw.includes('extra')) return materialMap['mat_extra'] || materialMap['mat_extra_1'] || materialMap['mat_extra_2'] || Object.values(materialMap)[0];
      if (normRaw.includes('caliper')) return materialMap['mat_caliper_op'] || materialMap['mat_caliper'] || Object.values(materialMap)[0];
      if (normRaw.includes('dischot')) return materialMap['mat_disc_hot_op'] || Object.values(materialMap)[0];
      if (normRaw.includes('disc')) return materialMap['mat_disc_op'] || materialMap['mat_disc_hot_op'] || Object.values(materialMap)[0];
      if (normRaw.includes('riminner')) return materialMap['mat_rims_inner'] || Object.values(materialMap)[0];
      if (normRaw.includes('rim') && hasOpTag) return materialMap['mat_rims_op'] || materialMap['mat_extra_rims_opacity'] || Object.values(materialMap)[0];
      if (normRaw.includes('rim')) return materialMap['mat_rims'] || materialMap['mat_rims_inner'] || Object.values(materialMap)[0];
      if (normRaw.includes('tire') || normRaw.includes('wheel')) return materialMap['mat_tires'] || materialMap['mat_extra_wheel'] || materialMap['mat_wheel'] || Object.values(materialMap)[0];

      return Object.values(materialMap)[0];
    };

    fbx.traverse((child) => {
      if (child.isMesh) {
        child.receiveShadow = true;
        const meshName = child.name || '';
        const lowerName = meshName.toLowerCase();

        // Properly preserve Multi-Material Arrays (Crucial for split meshes like Body, Mirror, Wing!)
        if (Array.isArray(child.material)) {
          child.material = child.material.map(m => resolveSingleMaterial(m ? m.name : '', meshName));
        } else {
          child.material = resolveSingleMaterial(child.material ? child.material.name : '', meshName);
        }

        // Avoid casting opaque square box shadows from transparent glass, disc cutouts, and rim cutouts!
        const isCutoutOrGlass = lowerName.includes('cover') ||
                                lowerName.includes('disc') ||
                                lowerName.includes('caliper') ||
                                lowerName.includes('louver') ||
                                lowerName.includes('rim') ||
                                lowerName.includes('glass') ||
                                lowerName.includes('window');
        child.castShadow = !isCutoutOrGlass;
      }
    });

    // Precise Bounding Box Normalization & Grounding
    fbx.position.set(0, 0, 0);
    const box = new THREE.Box3().setFromObject(fbx);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const targetScale = 4.3;
    const scaleFactor = targetScale / (maxDim > 0 ? maxDim : 1);
    fbx.scale.setScalar(scaleFactor);
    fbx.updateMatrixWorld(true);

    const scaledBox = new THREE.Box3().setFromObject(fbx);
    const scaledCenter = scaledBox.getCenter(new THREE.Vector3());

    fbx.position.x = -scaledCenter.x;
    fbx.position.z = -scaledCenter.z;
    fbx.position.y = -scaledBox.min.y;
    fbx.updateMatrixWorld(true);

    carGroup = fbx;
    scene.add(carGroup);

    activeCarKey = carKey;
    activeCarMaterials = materialMap;
    updateFlopShaderParameters();
    if (typeof renderMaterialInspector === 'function') renderMaterialInspector();
    hideShowroomLoading();
  } catch (err) {
    console.error(`Fleet Load Error (${carKey}):`, err);
    hideShowroomLoading();
    alert(`${title} 3D 모델 로드 실패: ${err.message}`);
  }
}

async function loadLamboModel() {
  return loadFleetVehicle('lambo');
}

/* =========================================================================
   5-2. MATERIAL TRANSPARENCY & PBR LIVE TUNER STUDIO
   ========================================================================= */
let activeCarKey = 'bentley';
let activeCarMaterials = {};
let activeMatFilter = 'all';

const FLEET_DEFAULT_MAT_SETTINGS = {
  spark: {
    'mat_body': { mode: 'opaque', opacity: 1.0, alphaTest: 0, depthWrite: true, transparent: false, doubleSide: true },
    'mat_extra': { mode: 'opaque', opacity: 1.0, alphaTest: 0, depthWrite: true, transparent: false, doubleSide: true },
    'mat_extra_op': { mode: 'glass', opacity: 0.65, alphaTest: 0, depthWrite: false, transparent: true, doubleSide: true, roughness: 0.05, metalness: 0.10 },
    'mat_tires': { mode: 'opaque', opacity: 1.0, alphaTest: 0, depthWrite: true, transparent: false, doubleSide: false },
    'mat_rims_inner': { mode: 'opaque', opacity: 1.0, alphaTest: 0, depthWrite: true, transparent: false, doubleSide: false },
    'mat_rims_op': { mode: 'cutout', opacity: 1.0, alphaTest: 0.45, depthWrite: true, transparent: false, doubleSide: true },
    'mat_caliper_op': { mode: 'cutout', opacity: 1.0, alphaTest: 0.45, depthWrite: true, transparent: false, doubleSide: true },
    'mat_disc_op': { mode: 'cutout', opacity: 1.0, alphaTest: 0.45, depthWrite: true, transparent: false, doubleSide: true },
    'mat_disc_hot_op': { mode: 'blend', opacity: 0.0, alphaTest: 0, depthWrite: false, transparent: true, doubleSide: true }
  },
  lambo: {
    'mat_body1': { mode: 'opaque', opacity: 1.0, alphaTest: 0, depthWrite: true, transparent: false, doubleSide: true },
    'mat_body_2': { mode: 'opaque', opacity: 1.0, alphaTest: 0, depthWrite: true, transparent: false, doubleSide: true },
    'mat_headlight_cover_opacity': { mode: 'glass', opacity: 0.60, alphaTest: 0, depthWrite: false, transparent: true, doubleSide: true, roughness: 0.05, metalness: 0.10 },
    'mat_louver_opacity': { mode: 'glass', opacity: 0.85, alphaTest: 0, depthWrite: false, transparent: true, doubleSide: true, roughness: 0.10, metalness: 0.30 },
    'mat_extra_wheel': { mode: 'opaque', opacity: 1.0, alphaTest: 0, depthWrite: true, transparent: false, doubleSide: false },
    'mat_extra_rims_opacity': { mode: 'cutout', opacity: 1.0, alphaTest: 0.45, depthWrite: true, transparent: false, doubleSide: true },
    'mat_caliper_op': { mode: 'cutout', opacity: 1.0, alphaTest: 0.45, depthWrite: true, transparent: false, doubleSide: true },
    'mat_disc_op': { mode: 'cutout', opacity: 1.0, alphaTest: 0.45, depthWrite: true, transparent: false, doubleSide: true },
    'mat_disc_hot_op': { mode: 'blend', opacity: 0.0, alphaTest: 0, depthWrite: false, transparent: true, doubleSide: true }
  },
  golf: {
    'mat_base': { mode: 'opaque', opacity: 1.0, alphaTest: 0, depthWrite: true, transparent: false, doubleSide: true },
    'mat_extra': { mode: 'opaque', opacity: 1.0, alphaTest: 0, depthWrite: true, transparent: false, doubleSide: true },
    'mat_extra_lip': { mode: 'opaque', opacity: 1.0, alphaTest: 0, depthWrite: true, transparent: false, doubleSide: true },
    'mat_emblem': { mode: 'opaque', opacity: 1.0, alphaTest: 0, depthWrite: true, transparent: false, doubleSide: true },
    'mat_headlight_op': { mode: 'opaque', opacity: 1.0, alphaTest: 0, depthWrite: true, transparent: false, doubleSide: true },
    'mat_extra_wheel': { mode: 'opaque', opacity: 1.0, alphaTest: 0, depthWrite: true, transparent: false, doubleSide: false },
    'mat_extra_rims_opacity': { mode: 'cutout', opacity: 1.0, alphaTest: 0.45, depthWrite: true, transparent: false, doubleSide: true },
    'mat_caliper_op': { mode: 'cutout', opacity: 1.0, alphaTest: 0.45, depthWrite: true, transparent: false, doubleSide: true },
    'mat_disc_op': { mode: 'cutout', opacity: 1.0, alphaTest: 0.45, depthWrite: true, transparent: false, doubleSide: true },
    'mat_disc_hot_op': { mode: 'blend', opacity: 0.0, alphaTest: 0, depthWrite: false, transparent: true, doubleSide: true }
  },
  bugatti: {
    'mat_body': { mode: 'opaque', opacity: 1.0, alphaTest: 0, depthWrite: true, transparent: false, doubleSide: true },
    'mat_extra_1': { mode: 'opaque', opacity: 1.0, alphaTest: 0, depthWrite: true, transparent: false, doubleSide: true },
    'mat_extra_2': { mode: 'opaque', opacity: 1.0, alphaTest: 0, depthWrite: true, transparent: false, doubleSide: true },
    'mat_extra_engine': { mode: 'opaque', opacity: 1.0, alphaTest: 0, depthWrite: true, transparent: false, doubleSide: true },
    'mat_headlight_cover_op': { mode: 'glass', opacity: 0.60, alphaTest: 0, depthWrite: false, transparent: true, doubleSide: true },
    'mat_tire': { mode: 'opaque', opacity: 1.0, alphaTest: 0, depthWrite: true, transparent: false, doubleSide: false },
    'mat_rims_op': { mode: 'cutout', opacity: 1.0, alphaTest: 0.45, depthWrite: true, transparent: false, doubleSide: true },
    'mat_caliper_op': { mode: 'cutout', opacity: 1.0, alphaTest: 0.45, depthWrite: true, transparent: false, doubleSide: true },
    'mat_disc_op': { mode: 'cutout', opacity: 1.0, alphaTest: 0.45, depthWrite: true, transparent: false, doubleSide: true },
    'mat_disc_hot_op': { mode: 'blend', opacity: 0.0, alphaTest: 0, depthWrite: false, transparent: true, doubleSide: true }
  },
  mustang: {
    'mat_body': { mode: 'opaque', opacity: 1.0, alphaTest: 0, depthWrite: true, transparent: false, doubleSide: true },
    'mat_extra_1': { mode: 'opaque', opacity: 1.0, alphaTest: 0, depthWrite: true, transparent: false, doubleSide: true },
    'mat_extra_op': { mode: 'glass', opacity: 0.60, alphaTest: 0, depthWrite: false, transparent: true, doubleSide: true },
    'mat_wheel': { mode: 'opaque', opacity: 1.0, alphaTest: 0, depthWrite: true, transparent: false, doubleSide: false },
    'mat_rims_op': { mode: 'cutout', opacity: 1.0, alphaTest: 0.45, depthWrite: true, transparent: false, doubleSide: true },
    'mat_caliper_op': { mode: 'cutout', opacity: 1.0, alphaTest: 0.45, depthWrite: true, transparent: false, doubleSide: true },
    'mat_disc_op': { mode: 'cutout', opacity: 1.0, alphaTest: 0.45, depthWrite: true, transparent: false, doubleSide: true },
    'mat_disc_hot_op': { mode: 'blend', opacity: 0.0, alphaTest: 0, depthWrite: false, transparent: true, doubleSide: true }
  },
  spano: {
    'mat_body': { mode: 'opaque', opacity: 1.0, alphaTest: 0, depthWrite: true, transparent: false, doubleSide: true },
    'mat_extra': { mode: 'opaque', opacity: 1.0, alphaTest: 0, depthWrite: true, transparent: false, doubleSide: true },
    'mat_extra_2': { mode: 'cutout', opacity: 1.0, alphaTest: 0.45, depthWrite: true, transparent: false, doubleSide: true },
    'mat_extra_hot': { mode: 'blend', opacity: 0.0, alphaTest: 0, depthWrite: false, transparent: true, doubleSide: true },
    'mat_extra_wheelcap': { mode: 'opaque', opacity: 1.0, alphaTest: 0, depthWrite: true, transparent: false, doubleSide: true },
    'mat_opacity_1': { mode: 'glass', opacity: 0.65, alphaTest: 0, depthWrite: false, transparent: true, doubleSide: true },
    'mat_opacity_2': { mode: 'cutout', opacity: 1.0, alphaTest: 0.45, depthWrite: true, transparent: false, doubleSide: true }
  },
  stinger: {
    'mat_body': { mode: 'opaque', opacity: 1.0, alphaTest: 0, depthWrite: true, transparent: false, doubleSide: true },
    'mat_extra': { mode: 'opaque', opacity: 1.0, alphaTest: 0, depthWrite: true, transparent: false, doubleSide: true },
    'mat_headlight_cover_op': { mode: 'glass', opacity: 0.60, alphaTest: 0, depthWrite: false, transparent: true, doubleSide: true },
    'mat_wheel': { mode: 'opaque', opacity: 1.0, alphaTest: 0, depthWrite: true, transparent: false, doubleSide: false },
    'mat_rims_op': { mode: 'cutout', opacity: 1.0, alphaTest: 0.45, depthWrite: true, transparent: false, doubleSide: true },
    'mat_caliper_op': { mode: 'cutout', opacity: 1.0, alphaTest: 0.45, depthWrite: true, transparent: false, doubleSide: true },
    'mat_disc_op': { mode: 'cutout', opacity: 1.0, alphaTest: 0.45, depthWrite: true, transparent: false, doubleSide: true },
    'mat_disc_hot_op': { mode: 'blend', opacity: 0.0, alphaTest: 0, depthWrite: false, transparent: true, doubleSide: true }
  },
  svr: {
    'mat_body__': { mode: 'opaque', opacity: 1.0, alphaTest: 0, depthWrite: true, transparent: false, doubleSide: true },
    'mat_extract': { mode: 'opaque', opacity: 1.0, alphaTest: 0, depthWrite: true, transparent: false, doubleSide: true },
    'mat_wheel': { mode: 'opaque', opacity: 1.0, alphaTest: 0, depthWrite: true, transparent: false, doubleSide: false },
    'mat_rims': { mode: 'cutout', opacity: 1.0, alphaTest: 0.45, depthWrite: true, transparent: false, doubleSide: true },
    'mat_caliper_op': { mode: 'cutout', opacity: 1.0, alphaTest: 0.45, depthWrite: true, transparent: false, doubleSide: true },
    'mat_disc_op': { mode: 'cutout', opacity: 1.0, alphaTest: 0.45, depthWrite: true, transparent: false, doubleSide: true },
    'mat_disc_hot_op': { mode: 'blend', opacity: 0.0, alphaTest: 0, depthWrite: false, transparent: true, doubleSide: true }
  },
  cobalt: {
    'mat_body': { mode: 'opaque', opacity: 1.0, alphaTest: 0, depthWrite: true, transparent: false, doubleSide: true },
    'mat_extra': { mode: 'opaque', opacity: 1.0, alphaTest: 0, depthWrite: true, transparent: false, doubleSide: true },
    'mat_wheels': { mode: 'opaque', opacity: 1.0, alphaTest: 0, depthWrite: true, transparent: false, doubleSide: false },
    'mat_rims': { mode: 'cutout', opacity: 1.0, alphaTest: 0.45, depthWrite: true, transparent: false, doubleSide: true },
    'mat_rims_op': { mode: 'cutout', opacity: 1.0, alphaTest: 0.45, depthWrite: true, transparent: false, doubleSide: true },
    'mat_caliper_op': { mode: 'cutout', opacity: 1.0, alphaTest: 0.45, depthWrite: true, transparent: false, doubleSide: true },
    'mat_disc_op': { mode: 'cutout', opacity: 1.0, alphaTest: 0.45, depthWrite: true, transparent: false, doubleSide: true },
    'mat_disc_hot_op': { mode: 'blend', opacity: 0.0, alphaTest: 0, depthWrite: false, transparent: true, doubleSide: true }
  },
  bentley: {
    'mat_body': { mode: 'opaque', opacity: 1.0, alphaTest: 0, depthWrite: true, transparent: false, doubleSide: true },
    'mat_extra': { mode: 'opaque', opacity: 1.0, alphaTest: 0, depthWrite: true, transparent: false, doubleSide: true },
    'mat_wheel': { mode: 'opaque', opacity: 1.0, alphaTest: 0, depthWrite: true, transparent: false, doubleSide: false },
    'mat_rims': { mode: 'cutout', opacity: 1.0, alphaTest: 0.45, depthWrite: true, transparent: false, doubleSide: true }
  }
};

const MAT_SETTINGS_VERSION = 'v7_maya_fleet';
try {
  if (localStorage.getItem('proto_mat_version') !== MAT_SETTINGS_VERSION) {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith('proto_mat_settings_')) {
        localStorage.removeItem(k);
      }
    }
    localStorage.setItem('proto_mat_version', MAT_SETTINGS_VERSION);
  }
} catch (e) {}

function getVehicleSavedMaterialSettings(carKey) {
  try {
    const raw = localStorage.getItem(`proto_mat_settings_${carKey}`);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveVehicleMaterialSetting(carKey, mKey, setting) {
  try {
    const current = getVehicleSavedMaterialSettings(carKey);
    current[mKey.toLowerCase()] = setting;
    localStorage.setItem(`proto_mat_settings_${carKey}`, JSON.stringify(current));
  } catch (e) {
    console.warn("Failed to save material setting to localStorage", e);
  }
}

function applySingleMaterialSetting(mat, setting) {
  if (!mat) return;
  const mode = setting.mode || 'opaque';
  mat.userData = mat.userData || {};
  mat.userData.mode = mode;
  mat.userData.setting = { ...setting };

  const doubleSide = setting.doubleSide !== false;
  mat.side = doubleSide ? THREE.DoubleSide : THREE.FrontSide;

  if (mode === 'opaque') {
    mat.transparent = false;
    mat.opacity = 1.0;
    mat.alphaTest = 0.0;
    mat.depthWrite = true;
    mat.alphaMap = null;
    if (setting.roughness !== undefined) mat.roughness = setting.roughness;
    if (setting.metalness !== undefined) mat.metalness = setting.metalness;
  } else if (mode === 'glass') {
    mat.transparent = true;
    mat.opacity = setting.opacity !== undefined ? setting.opacity : 0.65;
    mat.alphaTest = 0.0;
    mat.depthWrite = setting.depthWrite !== undefined ? setting.depthWrite : false;
    mat.alphaMap = mat.userData.origAlphaMap || null;
    mat.roughness = setting.roughness !== undefined ? setting.roughness : 0.05;
    mat.metalness = setting.metalness !== undefined ? setting.metalness : 0.15;
    mat.envMapIntensity = 2.2;
  } else if (mode === 'cutout') {
    mat.transparent = false;
    mat.opacity = 1.0;
    mat.alphaTest = setting.alphaTest !== undefined ? setting.alphaTest : 0.45;
    mat.depthWrite = true;
    mat.alphaMap = mat.userData.origAlphaMap || null;
    if (setting.roughness !== undefined) mat.roughness = setting.roughness;
    if (setting.metalness !== undefined) mat.metalness = setting.metalness;
  } else if (mode === 'blend') {
    mat.transparent = true;
    mat.opacity = setting.opacity !== undefined ? setting.opacity : 0.50;
    mat.alphaTest = setting.alphaTest !== undefined ? setting.alphaTest : 0.0;
    mat.depthWrite = setting.depthWrite !== undefined ? setting.depthWrite : false;
    mat.alphaMap = mat.userData.origAlphaMap || null;
    if (setting.roughness !== undefined) mat.roughness = setting.roughness;
    if (setting.metalness !== undefined) mat.metalness = setting.metalness;
  }

  if (setting.depthWrite !== undefined) {
    mat.depthWrite = setting.depthWrite;
  }

  mat.needsUpdate = true;
}

function inferDefaultMaterialSetting(keyLower, opacityTex) {
  // Hot discs are auxiliary glowing overlay planes - disabled by default in showroom to show underlying 3D rotor modeling
  if (keyLower.includes('disc_hot') || keyLower.includes('extra_hot') || keyLower.includes('dischot')) {
    return {
      mode: 'blend',
      opacity: 0.0,
      alphaTest: 0.0,
      depthWrite: false,
      transparent: true,
      doubleSide: true
    };
  }

  const isGlass = keyLower.includes('headlight_cover') ||
                  keyLower.includes('extra_op') ||
                  keyLower.includes('louver') ||
                  keyLower.includes('opacity_1') ||
                  keyLower.includes('glass') ||
                  keyLower.includes('window');

  const isCutout = ((keyLower.includes('disc') || keyLower.includes('rim') || keyLower.includes('caliper') || keyLower.includes('opacity_2')) &&
                    (keyLower.includes('op') || keyLower.includes('opacity') || keyLower.includes('rim') || keyLower.includes('caliper'))) ||
                   Boolean(opacityTex && !isGlass);

  if (isGlass) {
    return {
      mode: 'glass',
      opacity: keyLower.includes('louver') ? 0.85 : 0.65,
      alphaTest: 0.0,
      depthWrite: false,
      transparent: true,
      doubleSide: true,
      roughness: 0.05,
      metalness: 0.15
    };
  }

  if (isCutout && opacityTex) {
    return {
      mode: 'cutout',
      opacity: 1.0,
      alphaTest: 0.45,
      depthWrite: true,
      transparent: false,
      doubleSide: true
    };
  }

  return {
    mode: 'opaque',
    opacity: 1.0,
    alphaTest: 0.0,
    depthWrite: true,
    transparent: false,
    doubleSide: true
  };
}

function getUniqueActiveMaterials() {
  const result = {};
  const seenInstances = new Set();
  for (const [key, mat] of Object.entries(activeCarMaterials)) {
    if (!mat || !mat.isMaterial) continue;
    if (seenInstances.has(mat)) continue;
    seenInstances.add(mat);
    const displayName = mat.name || key;
    result[displayName] = mat;
  }
  return result;
}

function getMaterialCategory(name) {
  const nl = (name || '').toLowerCase();
  if (nl.includes('glass') || nl.includes('louver') || nl.includes('cover') || nl.includes('window') || nl.includes('op_1') || nl.includes('op_2') || nl.includes('headlight') || nl.includes('extra_op')) {
    return 'glass';
  }
  if (nl.includes('wheel') || nl.includes('rim') || nl.includes('disc') || nl.includes('caliper') || nl.includes('tire')) {
    return 'wheel';
  }
  return 'body';
}

function showInspectorToast(msg) {
  const toast = document.getElementById('mat-inspector-toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

function initMaterialInspector() {
  const toggleBtn = document.getElementById('btn-toggle-mat-inspector');
  const panel = document.getElementById('mat-inspector-panel');
  const toggleLabel = document.getElementById('mat-inspector-toggle-label');
  const resetBtn = document.getElementById('btn-reset-mat-settings');
  const copyBtn = document.getElementById('btn-copy-mat-json');
  const filterBtns = document.querySelectorAll('.mat-filter-btn');

  if (toggleBtn && panel) {
    toggleBtn.addEventListener('click', () => {
      const isHidden = panel.classList.contains('hidden');
      if (isHidden) {
        panel.classList.remove('hidden');
        if (toggleLabel) toggleLabel.textContent = '튜너 닫기 ▲';
        renderMaterialInspector();
      } else {
        panel.classList.add('hidden');
        if (toggleLabel) toggleLabel.textContent = '튜너 열기 ▼';
      }
    });
  }

  if (filterBtns) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => {
          b.classList.remove('bg-showroom-gold/20', 'text-showroom-gold', 'border-showroom-gold/40');
          b.classList.add('bg-white/5', 'text-slate-400', 'border-white/10');
        });
        btn.classList.remove('bg-white/5', 'text-slate-400', 'border-white/10');
        btn.classList.add('bg-showroom-gold/20', 'text-showroom-gold', 'border-showroom-gold/40');
        activeMatFilter = btn.getAttribute('data-filter') || 'all';
        renderMaterialInspector();
      });
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (!activeCarKey) return;
      localStorage.removeItem(`proto_mat_settings_${activeCarKey}`);
      const defaults = FLEET_DEFAULT_MAT_SETTINGS[activeCarKey] || {};
      for (const [k, mat] of Object.entries(activeCarMaterials)) {
        const keyLower = k.toLowerCase();
        const setting = defaults[keyLower] || inferDefaultMaterialSetting(keyLower, mat.userData ? mat.userData.origAlphaMap : null);
        applySingleMaterialSetting(mat, setting);
      }
      renderMaterialInspector();
      showInspectorToast('🔄 머티리얼 세팅이 기본값으로 초기화되었습니다.');
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      if (!activeCarKey) return;
      const exportData = {};
      const uniqueMats = getUniqueActiveMaterials();
      for (const [k, mat] of Object.entries(uniqueMats)) {
        exportData[k] = {
          mode: mat.userData && mat.userData.mode ? mat.userData.mode : (mat.transparent ? 'glass' : (mat.alphaTest > 0 ? 'cutout' : 'opaque')),
          opacity: Number((mat.opacity ?? 1.0).toFixed(2)),
          alphaTest: Number((mat.alphaTest ?? 0.0).toFixed(2)),
          depthWrite: mat.depthWrite !== false,
          transparent: !!mat.transparent,
          doubleSide: mat.side === THREE.DoubleSide
        };
      }
      const jsonStr = JSON.stringify(exportData, null, 2);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(jsonStr).then(() => {
          showInspectorToast('📋 머티리얼 JSON 설정이 클립보드에 복사되었습니다!');
        }).catch(() => {
          prompt('머티리얼 JSON 설정을 복사하세요:', jsonStr);
        });
      } else {
        prompt('머티리얼 JSON 설정을 복사하세요:', jsonStr);
      }
    });
  }
}

function renderMaterialInspector() {
  const container = document.getElementById('mat-inspector-container');
  if (!container) return;

  const uniqueMats = getUniqueActiveMaterials();
  const matKeys = Object.keys(uniqueMats);

  if (matKeys.length === 0) {
    container.innerHTML = `
      <div class="p-3 text-center text-slate-500 bg-white/[0.02] rounded-xl border border-white/5">
        전시장 차량이 로드되면 조작 가능한 머티리얼 목록이 표시됩니다.
      </div>
    `;
    return;
  }

  const filteredKeys = matKeys.filter(key => {
    if (activeMatFilter === 'all') return true;
    return getMaterialCategory(key) === activeMatFilter;
  });

  if (filteredKeys.length === 0) {
    container.innerHTML = `
      <div class="p-3 text-center text-slate-500 bg-white/[0.02] rounded-xl border border-white/5">
        선택한 카테고리에 해당하는 머티리얼이 없습니다.
      </div>
    `;
    return;
  }

  container.innerHTML = filteredKeys.map(key => {
    const mat = uniqueMats[key];
    const currentMode = (mat.userData && mat.userData.mode) ? mat.userData.mode : 
                        (mat.transparent && mat.opacity < 1.0 ? 'glass' : (mat.alphaTest > 0 ? 'cutout' : 'opaque'));
    const opacityVal = (mat.opacity !== undefined ? mat.opacity : 1.0).toFixed(2);
    const alphaTestVal = (mat.alphaTest !== undefined ? mat.alphaTest : 0.0).toFixed(2);
    const isDoubleSide = mat.side === THREE.DoubleSide;
    const isDepthWrite = mat.depthWrite !== false;

    const modeLabels = {
      opaque: { label: '불투명', class: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
      glass: { label: '유리/틴트', class: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
      cutout: { label: '타공', class: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
      blend: { label: '반투명', class: 'bg-purple-500/20 text-purple-300 border-purple-500/30' }
    };

    const currentBadge = modeLabels[currentMode] || modeLabels.opaque;

    return `
      <div class="mat-card p-2.5 rounded-xl bg-black/40 border border-white/10 hover:border-showroom-gold/40 transition-all space-y-2" data-mat-name="${key}">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5 min-w-0 pr-2">
            <span class="w-2 h-2 rounded-full ${currentMode === 'opaque' ? 'bg-emerald-400' : (currentMode === 'glass' ? 'bg-sky-400' : (currentMode === 'cutout' ? 'bg-amber-400' : 'bg-purple-400'))} shrink-0"></span>
            <span class="font-bold text-white truncate text-[11px]" title="${key}">${key}</span>
          </div>
          <span class="mat-mode-badge text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold border ${currentBadge.class}">${currentBadge.label}</span>
        </div>

        <div class="grid grid-cols-4 gap-1 text-[9px]">
          <button data-set-mode="opaque" class="btn-mode px-1 py-1 rounded border text-center transition-all ${currentMode === 'opaque' ? 'bg-emerald-500/30 border-emerald-400 text-white font-bold' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}">불투명</button>
          <button data-set-mode="glass" class="btn-mode px-1 py-1 rounded border text-center transition-all ${currentMode === 'glass' ? 'bg-sky-500/30 border-sky-400 text-white font-bold' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}">유리</button>
          <button data-set-mode="cutout" class="btn-mode px-1 py-1 rounded border text-center transition-all ${currentMode === 'cutout' ? 'bg-amber-500/30 border-amber-400 text-white font-bold' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}">타공</button>
          <button data-set-mode="blend" class="btn-mode px-1 py-1 rounded border text-center transition-all ${currentMode === 'blend' ? 'bg-purple-500/30 border-purple-400 text-white font-bold' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}">반투명</button>
        </div>

        <div class="space-y-1.5 pt-1 border-t border-white/5">
          <div class="flex items-center justify-between gap-2">
            <span class="text-slate-400 shrink-0 text-[9px]">투명도</span>
            <input type="range" class="slider-opacity flex-1 h-1 bg-slate-700 rounded appearance-none cursor-pointer accent-showroom-gold" min="0" max="1" step="0.01" value="${opacityVal}">
            <span class="val-opacity text-slate-300 w-8 text-right font-mono text-[9px]">${opacityVal}</span>
          </div>

          <div class="flex items-center justify-between gap-2">
            <span class="text-slate-400 shrink-0 text-[9px]">알파 컷</span>
            <input type="range" class="slider-alphatest flex-1 h-1 bg-slate-700 rounded appearance-none cursor-pointer accent-showroom-gold" min="0" max="1" step="0.05" value="${alphaTestVal}">
            <span class="val-alphatest text-slate-300 w-8 text-right font-mono text-[9px]">${alphaTestVal}</span>
          </div>

          <div class="flex items-center justify-between pt-1 text-[9px] text-slate-400">
            <label class="flex items-center gap-1 cursor-pointer hover:text-white">
              <input type="checkbox" class="chk-doubleside accent-showroom-gold rounded cursor-pointer" ${isDoubleSide ? 'checked' : ''}>
              <span>양면 (Double)</span>
            </label>
            <label class="flex items-center gap-1 cursor-pointer hover:text-white">
              <input type="checkbox" class="chk-depthwrite accent-showroom-gold rounded cursor-pointer" ${isDepthWrite ? 'checked' : ''}>
              <span>깊이 (DepthWrite)</span>
            </label>
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.mat-card').forEach(card => {
    const matName = card.getAttribute('data-mat-name');
    const mat = uniqueMats[matName];
    if (!mat) return;

    const opacitySlider = card.querySelector('.slider-opacity');
    const opacityValSpan = card.querySelector('.val-opacity');
    const alphaTestSlider = card.querySelector('.slider-alphatest');
    const alphaTestValSpan = card.querySelector('.val-alphatest');
    const doubleSideChk = card.querySelector('.chk-doubleside');
    const depthWriteChk = card.querySelector('.chk-depthwrite');

    const updateMatAndSave = (partialSetting) => {
      const currentSetting = (mat.userData && mat.userData.setting) ? { ...mat.userData.setting } : {
        mode: mat.userData && mat.userData.mode ? mat.userData.mode : 'opaque',
        opacity: mat.opacity,
        alphaTest: mat.alphaTest,
        doubleSide: mat.side === THREE.DoubleSide,
        depthWrite: mat.depthWrite !== false
      };
      const merged = { ...currentSetting, ...partialSetting };
      applySingleMaterialSetting(mat, merged);
      saveVehicleMaterialSetting(activeCarKey, matName, merged);
    };

    card.querySelectorAll('.btn-mode').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetMode = btn.getAttribute('data-set-mode');
        let newSetting = { mode: targetMode };
        if (targetMode === 'opaque') {
          newSetting.opacity = 1.0;
          newSetting.alphaTest = 0.0;
          newSetting.depthWrite = true;
          newSetting.transparent = false;
        } else if (targetMode === 'glass') {
          newSetting.opacity = 0.65;
          newSetting.alphaTest = 0.0;
          newSetting.depthWrite = false;
          newSetting.transparent = true;
          newSetting.doubleSide = true;
        } else if (targetMode === 'cutout') {
          newSetting.opacity = 1.0;
          newSetting.alphaTest = 0.45;
          newSetting.depthWrite = true;
          newSetting.transparent = false;
          newSetting.doubleSide = true;
        } else if (targetMode === 'blend') {
          newSetting.opacity = 0.50;
          newSetting.alphaTest = 0.0;
          newSetting.depthWrite = false;
          newSetting.transparent = true;
          newSetting.doubleSide = true;
        }

        updateMatAndSave(newSetting);
        renderMaterialInspector();
      });
    });

    if (opacitySlider) {
      opacitySlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (opacityValSpan) opacityValSpan.textContent = val.toFixed(2);
        updateMatAndSave({ opacity: val });
      });
    }

    if (alphaTestSlider) {
      alphaTestSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (alphaTestValSpan) alphaTestValSpan.textContent = val.toFixed(2);
        updateMatAndSave({ alphaTest: val });
      });
    }

    if (doubleSideChk) {
      doubleSideChk.addEventListener('change', (e) => {
        updateMatAndSave({ doubleSide: e.target.checked });
      });
    }

    if (depthWriteChk) {
      depthWriteChk.addEventListener('change', (e) => {
        updateMatAndSave({ depthWrite: e.target.checked });
      });
    }
  });
}

/* =========================================================================
   6. FLOP METALLIC SHADER CONTROLS (DEV MODE & PRESET STORAGE ENGINE)
   ========================================================================= */
const BuiltinFlopPresets = {
  'candy-red': {
    name: 'Candy Red',
    subtitle: 'Red → Burgundy',
    base: '#d81422',
    flop: '#4a030a',
    falloff: 2.5,
    flopIntensity: 2.2,
    clearcoat: 0.95,
    clearcoatRoughness: 0.05,
    metalness: 0.88,
    roughness: 0.16
  },
  'cyber-cyan': {
    name: 'Cyber Cyan',
    subtitle: 'Cyan → Violet',
    base: '#00d2ff',
    flop: '#3a0078',
    falloff: 2.2,
    flopIntensity: 2.5,
    clearcoat: 0.98,
    clearcoatRoughness: 0.03,
    metalness: 0.92,
    roughness: 0.12
  },
  'sunset-gold': {
    name: 'Sunset Gold',
    subtitle: 'Gold → Copper',
    base: '#d49b38',
    flop: '#5e1b0b',
    falloff: 2.8,
    flopIntensity: 2.0,
    clearcoat: 0.92,
    clearcoatRoughness: 0.06,
    metalness: 0.85,
    roughness: 0.18
  },
  'midnight-pearl': {
    name: 'Midnight Pearl',
    subtitle: 'Black → Emerald',
    base: '#111317',
    flop: '#00553a',
    falloff: 3.2,
    flopIntensity: 2.6,
    clearcoat: 0.95,
    clearcoatRoughness: 0.04,
    metalness: 0.80,
    roughness: 0.20
  }
};

let FlopPresets = { ...BuiltinFlopPresets };

function loadCustomFlopPresets() {
  try {
    const saved = localStorage.getItem('proto_custom_flop_presets');
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.assign(FlopPresets, parsed);
    }
  } catch (e) {
    console.warn("Could not load custom flop presets:", e);
  }
}

function setDevMode(enabled) {
  ShowroomState.devMode = enabled;
  try {
    localStorage.setItem('proto_dev_mode', enabled ? 'true' : 'false');
  } catch (e) {}

  const panel = document.getElementById('flop-debug-panel');
  const notice = document.getElementById('dev-locked-notice');
  const toggleBtn = document.getElementById('btn-dev-toggle');

  if (enabled) {
    if (panel) panel.classList.remove('hidden');
    if (notice) notice.classList.add('hidden');
    if (toggleBtn) {
      toggleBtn.classList.remove('border-white/10', 'bg-white/5', 'text-slate-400');
      toggleBtn.classList.add('border-emerald-500/50', 'bg-emerald-500/10', 'text-emerald-400');
      toggleBtn.innerHTML = `
        <i data-lucide="unlock" id="dev-lock-icon" class="w-3 h-3 text-emerald-400"></i>
        <span id="dev-mode-label">DEV ACTIVE</span>
      `;
    }
  } else {
    if (panel) panel.classList.add('hidden');
    if (notice) notice.classList.remove('hidden');
    if (toggleBtn) {
      toggleBtn.classList.remove('border-emerald-500/50', 'bg-emerald-500/10', 'text-emerald-400');
      toggleBtn.classList.add('border-white/10', 'bg-white/5', 'text-slate-400');
      toggleBtn.innerHTML = `
        <i data-lucide="lock" id="dev-lock-icon" class="w-3 h-3 text-slate-400"></i>
        <span id="dev-mode-label">DEV 튜너</span>
      `;
    }
  }

  if (window.lucide) lucide.createIcons();
  renderFlopPresetButtons();
}

function renderFlopPresetButtons(activeKey = 'candy-red') {
  const container = document.getElementById('flop-presets');
  if (!container) return;

  container.innerHTML = '';
  Object.keys(FlopPresets).forEach((key) => {
    const p = FlopPresets[key];
    const isBuiltin = key in BuiltinFlopPresets;
    const isActive = (key === activeKey);

    const btn = document.createElement('button');
    btn.className = `flop-preset-btn relative group px-2 py-1.5 rounded-lg border text-left transition-all ${
      isActive 
        ? 'border-showroom-gold bg-showroom-gold/15 text-showroom-gold' 
        : 'border-white/10 bg-white/5 hover:border-white/20 text-slate-300'
    }`;
    btn.dataset.preset = key;

    const deleteBtn = (!isBuiltin && ShowroomState.devMode)
      ? `<span class="delete-preset-btn absolute top-1 right-1.5 text-slate-500 hover:text-red-400 font-bold p-0.5 rounded cursor-pointer leading-none text-xs" data-delete="${key}" title="프리셋 삭제">×</span>`
      : '';

    btn.innerHTML = `
      <span class="block font-bold truncate pr-3">${p.name || key}</span>
      <span class="text-[9px] text-slate-400 truncate block">${p.subtitle || (p.base + ' → ' + p.flop)}</span>
      ${deleteBtn}
    `;

    btn.addEventListener('click', (e) => {
      if (e.target.dataset.delete) {
        e.stopPropagation();
        deleteCustomPreset(e.target.dataset.delete);
        return;
      }
      applyFlopPreset(key);
    });

    container.appendChild(btn);
  });
}

function applyFlopPreset(key) {
  const p = FlopPresets[key];
  if (!p) return;

  ShowroomState.baseColor = p.base;
  ShowroomState.flopColor = p.flop;
  ShowroomState.flopFalloff = p.falloff !== undefined ? p.falloff : 2.5;
  ShowroomState.flopIntensity = p.flopIntensity !== undefined ? p.flopIntensity : 2.2;
  ShowroomState.clearcoatStrength = p.clearcoat !== undefined ? p.clearcoat : 0.95;
  ShowroomState.clearcoatRoughness = p.clearcoatRoughness !== undefined ? p.clearcoatRoughness : 0.05;
  ShowroomState.metalness = p.metalness !== undefined ? p.metalness : 0.88;
  ShowroomState.roughness = p.roughness !== undefined ? p.roughness : 0.16;

  syncFlopDebugControls();
  updateFlopShaderParameters();

  const btns = document.querySelectorAll('.flop-preset-btn');
  btns.forEach(b => {
    if (b.dataset.preset === key) {
      b.classList.remove('border-white/10', 'bg-white/5', 'text-slate-300');
      b.classList.add('border-showroom-gold', 'bg-showroom-gold/15', 'text-showroom-gold');
    } else {
      b.classList.remove('border-showroom-gold', 'bg-showroom-gold/15', 'text-showroom-gold');
      b.classList.add('border-white/10', 'bg-white/5', 'text-slate-300');
    }
  });
}

function syncFlopDebugControls() {
  const basePicker = document.getElementById('flop-base-picker');
  const tintPicker = document.getElementById('flop-tint-picker');
  const baseLabel = document.getElementById('flop-base-label');
  const tintLabel = document.getElementById('flop-tint-label');
  const falloffSlider = document.getElementById('flop-falloff-slider');
  const falloffVal = document.getElementById('flop-falloff-val');
  const intensitySlider = document.getElementById('flop-intensity-slider');
  const intensityVal = document.getElementById('flop-intensity-val');
  const clearcoatSlider = document.getElementById('clearcoat-slider');
  const clearcoatVal = document.getElementById('clearcoat-val');
  const clearcoatRoughSlider = document.getElementById('clearcoat-rough-slider');
  const clearcoatRoughVal = document.getElementById('clearcoat-rough-val');
  const metalnessSlider = document.getElementById('metalness-slider');
  const metalnessVal = document.getElementById('metalness-val');
  const roughnessSlider = document.getElementById('roughness-slider');
  const roughnessVal = document.getElementById('roughness-val');

  if (basePicker) basePicker.value = ShowroomState.baseColor;
  if (baseLabel) baseLabel.textContent = ShowroomState.baseColor.toUpperCase();
  if (tintPicker) tintPicker.value = ShowroomState.flopColor;
  if (tintLabel) tintLabel.textContent = ShowroomState.flopColor.toUpperCase();

  if (falloffSlider) falloffSlider.value = ShowroomState.flopFalloff;
  if (falloffVal) falloffVal.textContent = Number(ShowroomState.flopFalloff).toFixed(1);

  if (intensitySlider) intensitySlider.value = ShowroomState.flopIntensity;
  if (intensityVal) intensityVal.textContent = Number(ShowroomState.flopIntensity).toFixed(1);

  if (clearcoatSlider) clearcoatSlider.value = ShowroomState.clearcoatStrength;
  if (clearcoatVal) clearcoatVal.textContent = Number(ShowroomState.clearcoatStrength).toFixed(2);

  if (clearcoatRoughSlider) clearcoatRoughSlider.value = ShowroomState.clearcoatRoughness;
  if (clearcoatRoughVal) clearcoatRoughVal.textContent = Number(ShowroomState.clearcoatRoughness).toFixed(2);

  if (metalnessSlider) metalnessSlider.value = ShowroomState.metalness;
  if (metalnessVal) metalnessVal.textContent = Number(ShowroomState.metalness).toFixed(2);

  if (roughnessSlider) roughnessSlider.value = ShowroomState.roughness;
  if (roughnessVal) roughnessVal.textContent = Number(ShowroomState.roughness).toFixed(2);
}

function saveCurrentAsCustomPreset(name) {
  if (!name || !name.trim()) {
    showPresetFeedback("프리셋 이름을 입력해주세요.");
    return;
  }
  const cleanName = name.trim();
  const slug = 'custom-' + cleanName.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').replace(/(^-|-$)/g, '');

  const newPreset = {
    name: cleanName,
    subtitle: `${ShowroomState.baseColor.toUpperCase()} → ${ShowroomState.flopColor.toUpperCase()}`,
    base: ShowroomState.baseColor,
    flop: ShowroomState.flopColor,
    falloff: Number(ShowroomState.flopFalloff),
    flopIntensity: Number(ShowroomState.flopIntensity),
    clearcoat: Number(ShowroomState.clearcoatStrength),
    clearcoatRoughness: Number(ShowroomState.clearcoatRoughness),
    metalness: Number(ShowroomState.metalness),
    roughness: Number(ShowroomState.roughness)
  };

  FlopPresets[slug] = newPreset;

  try {
    let saved = {};
    const raw = localStorage.getItem('proto_custom_flop_presets');
    if (raw) saved = JSON.parse(raw);
    saved[slug] = newPreset;
    localStorage.setItem('proto_custom_flop_presets', JSON.stringify(saved));
  } catch (e) {
    console.error("Failed to save custom preset to localStorage:", e);
  }

  renderFlopPresetButtons(slug);
  showPresetFeedback(`프리셋 '${cleanName}' 저장 완료!`);
}

function deleteCustomPreset(slug) {
  if (BuiltinFlopPresets[slug]) return;
  delete FlopPresets[slug];
  try {
    const raw = localStorage.getItem('proto_custom_flop_presets');
    if (raw) {
      const saved = JSON.parse(raw);
      delete saved[slug];
      localStorage.setItem('proto_custom_flop_presets', JSON.stringify(saved));
    }
  } catch (e) {
    console.error("Failed to delete custom preset:", e);
  }
  renderFlopPresetButtons('candy-red');
  applyFlopPreset('candy-red');
  showPresetFeedback("프리셋이 삭제되었습니다.");
}

function showPresetFeedback(msg) {
  const fb = document.getElementById('preset-feedback');
  if (!fb) return;
  fb.textContent = msg;
  fb.classList.remove('hidden');
  setTimeout(() => fb.classList.add('hidden'), 2800);
}

function copyPresetJSONToClipboard() {
  const code = {
    base: ShowroomState.baseColor,
    flop: ShowroomState.flopColor,
    falloff: Number(ShowroomState.flopFalloff),
    flopIntensity: Number(ShowroomState.flopIntensity),
    clearcoat: Number(ShowroomState.clearcoatStrength),
    clearcoatRoughness: Number(ShowroomState.clearcoatRoughness),
    metalness: Number(ShowroomState.metalness),
    roughness: Number(ShowroomState.roughness)
  };
  const jsonStr = JSON.stringify(code, null, 2);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(jsonStr).then(() => {
      showPresetFeedback("📋 프리셋 JSON이 클립보드에 복사되었습니다!");
    }).catch(() => {
      prompt("아래 코드를 복사하세요:", jsonStr);
    });
  } else {
    prompt("아래 코드를 복사하세요:", jsonStr);
  }
}

function initFlopShaderControls() {
  loadCustomFlopPresets();

  const toggleFlop = document.getElementById('toggle-flop');
  const devToggleBtn = document.getElementById('btn-dev-toggle');
  const basePicker = document.getElementById('flop-base-picker');
  const tintPicker = document.getElementById('flop-tint-picker');
  const baseLabel = document.getElementById('flop-base-label');
  const tintLabel = document.getElementById('flop-tint-label');
  const falloffSlider = document.getElementById('flop-falloff-slider');
  const falloffVal = document.getElementById('flop-falloff-val');
  const intensitySlider = document.getElementById('flop-intensity-slider');
  const intensityVal = document.getElementById('flop-intensity-val');
  const clearcoatSlider = document.getElementById('clearcoat-slider');
  const clearcoatVal = document.getElementById('clearcoat-val');
  const clearcoatRoughSlider = document.getElementById('clearcoat-rough-slider');
  const clearcoatRoughVal = document.getElementById('clearcoat-rough-val');
  const metalnessSlider = document.getElementById('metalness-slider');
  const metalnessVal = document.getElementById('metalness-val');
  const roughnessSlider = document.getElementById('roughness-slider');
  const roughnessVal = document.getElementById('roughness-val');

  const savePresetBtn = document.getElementById('btn-save-custom-preset');
  const customPresetInput = document.getElementById('custom-preset-input');
  const copyJsonBtn = document.getElementById('btn-copy-preset-json');
  const resetPresetBtn = document.getElementById('btn-reset-preset');

  // Dev Mode Initial state
  const isDev = localStorage.getItem('proto_dev_mode') === 'true';
  setDevMode(isDev);

  if (devToggleBtn) {
    devToggleBtn.addEventListener('click', () => {
      setDevMode(!ShowroomState.devMode);
    });
  }

  // Keyboard shortcut Alt + D
  window.addEventListener('keydown', (e) => {
    if (e.altKey && (e.key === 'd' || e.key === 'D' || e.key === 'ㅇ')) {
      e.preventDefault();
      setDevMode(!ShowroomState.devMode);
    }
  });

  // Toggle Flop Effect
  if (toggleFlop) {
    toggleFlop.addEventListener('change', (e) => {
      ShowroomState.flopEnabled = e.target.checked;
      updateFlopShaderParameters();
    });
  }

  // Sliders and Pickers
  if (basePicker) {
    basePicker.addEventListener('input', (e) => {
      ShowroomState.baseColor = e.target.value;
      if (baseLabel) baseLabel.textContent = e.target.value.toUpperCase();
      updateFlopShaderParameters();
    });
  }

  if (tintPicker) {
    tintPicker.addEventListener('input', (e) => {
      ShowroomState.flopColor = e.target.value;
      if (tintLabel) tintLabel.textContent = e.target.value.toUpperCase();
      updateFlopShaderParameters();
    });
  }

  if (falloffSlider) {
    falloffSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      ShowroomState.flopFalloff = val;
      if (falloffVal) falloffVal.textContent = val.toFixed(1);
      updateFlopShaderParameters();
    });
  }

  if (intensitySlider) {
    intensitySlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      ShowroomState.flopIntensity = val;
      if (intensityVal) intensityVal.textContent = val.toFixed(1);
      updateFlopShaderParameters();
    });
  }

  if (clearcoatSlider) {
    clearcoatSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      ShowroomState.clearcoatStrength = val;
      if (clearcoatVal) clearcoatVal.textContent = val.toFixed(2);
      updateFlopShaderParameters();
    });
  }

  if (clearcoatRoughSlider) {
    clearcoatRoughSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      ShowroomState.clearcoatRoughness = val;
      if (clearcoatRoughVal) clearcoatRoughVal.textContent = val.toFixed(2);
      updateFlopShaderParameters();
    });
  }

  if (metalnessSlider) {
    metalnessSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      ShowroomState.metalness = val;
      if (metalnessVal) metalnessVal.textContent = val.toFixed(2);
      updateFlopShaderParameters();
    });
  }

  if (roughnessSlider) {
    roughnessSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      ShowroomState.roughness = val;
      if (roughnessVal) roughnessVal.textContent = val.toFixed(2);
      updateFlopShaderParameters();
    });
  }

  // Custom Preset Actions
  if (savePresetBtn && customPresetInput) {
    savePresetBtn.addEventListener('click', () => {
      saveCurrentAsCustomPreset(customPresetInput.value);
      customPresetInput.value = '';
    });
    customPresetInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        saveCurrentAsCustomPreset(customPresetInput.value);
        customPresetInput.value = '';
      }
    });
  }

  if (copyJsonBtn) {
    copyJsonBtn.addEventListener('click', copyPresetJSONToClipboard);
  }

  if (resetPresetBtn) {
    resetPresetBtn.addEventListener('click', () => {
      applyFlopPreset('candy-red');
      showPresetFeedback("기본 Candy Red 프리셋으로 리셋되었습니다.");
    });
  }

  // Render initial preset buttons
  renderFlopPresetButtons('candy-red');
}

/* =========================================================================
   7. SHOWROOM CONTROLS (LIGHTING, CAMERA, TOGGLES)
   ========================================================================= */
function initShowroomControls() {
  const lightBtns = document.querySelectorAll('.light-btn');
  lightBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      lightBtns.forEach(b => {
        b.classList.remove('border-showroom-gold', 'bg-showroom-gold/15', 'text-showroom-gold');
        b.classList.add('border-white/10', 'bg-white/5', 'text-slate-300');
      });
      btn.classList.remove('border-white/10', 'bg-white/5', 'text-slate-300');
      btn.classList.add('border-showroom-gold', 'bg-showroom-gold/15', 'text-showroom-gold');

      updateLightingMode(btn.dataset.light);
    });
  });

  // Real-Time Viewport Exposure / Brightness Slider
  const exposureSlider = document.getElementById('exposure-slider');
  const exposureVal = document.getElementById('exposure-val');
  if (exposureSlider) {
    exposureSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (renderer) renderer.toneMappingExposure = val;
      if (exposureVal) exposureVal.textContent = val.toFixed(2);
    });
  }

  const camBtns = document.querySelectorAll('.cam-btn');
  const camPresets = {
    hero: { pos: { x: 5.2, y: 2.2, z: 5.2 }, target: { x: 0, y: 0.5, z: 0 } },
    side: { pos: { x: 6.8, y: 1.2, z: 0.1 }, target: { x: 0, y: 0.5, z: 0 } },
    wheel: { pos: { x: 2.2, y: 0.6, z: 2.4 }, target: { x: 1.05, y: 0.4, z: 1.45 } },
    top: { pos: { x: 0.1, y: 8.5, z: 0.5 }, target: { x: 0, y: 0, z: 0 } }
  };

  camBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const preset = camPresets[btn.dataset.cam];
      if (!preset) return;

      gsap.to(camera.position, {
        x: preset.pos.x,
        y: preset.pos.y,
        z: preset.pos.z,
        duration: 1.2,
        ease: 'power3.inOut'
      });

      gsap.to(controls.target, {
        x: preset.target.x,
        y: preset.target.y,
        z: preset.target.z,
        duration: 1.2,
        ease: 'power3.inOut',
        onUpdate: () => controls.update()
      });
    });
  });

  const autoRotateToggle = document.getElementById('toggle-autorotate');
  if (autoRotateToggle) {
    autoRotateToggle.addEventListener('change', (e) => {
      ShowroomState.autoRotate = e.target.checked;
      controls.autoRotate = e.target.checked;
    });
  }

  const wireframeToggle = document.getElementById('toggle-wireframe');
  if (wireframeToggle) {
    wireframeToggle.addEventListener('change', (e) => {
      ShowroomState.wireframe = e.target.checked;
      carGroup.traverse((child) => {
        if (child.isMesh && child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.wireframe = ShowroomState.wireframe);
          } else {
            child.material.wireframe = ShowroomState.wireframe;
          }
        }
      });
    });
  }

  const lightsToggle = document.getElementById('toggle-lights');
  if (lightsToggle) {
    lightsToggle.addEventListener('change', (e) => {
      ShowroomState.headlightsOn = e.target.checked;
      lightMeshMaterials.forEach((mat) => {
        gsap.to(mat, {
          emissiveIntensity: ShowroomState.headlightsOn ? 3.5 : 0.05,
          duration: 0.4
        });
      });
    });
  }
}

/* =========================================================================
   8. CUSTOM 3D MODEL LOADER (.GLB / .GLTF / .FBX)
   ========================================================================= */
function initCustomModelLoader() {
  const fileInput = document.getElementById('model-file-input');
  if (!fileInput) return;

  fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isFBX = fileName.endsWith('.fbx');

    const reader = new FileReader();
    reader.onload = (e) => {
      const contents = e.target.result;

      const onModelParsed = (loadedModel) => {
        if (carGroup) scene.remove(carGroup);

        const box = new THREE.Box3().setFromObject(loadedModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const scaleFactor = 4.2 / (maxDim || 1);
        loadedModel.scale.setScalar(scaleFactor);

        box.setFromObject(loadedModel);
        loadedModel.position.x = -center.x * scaleFactor;
        loadedModel.position.z = -center.z * scaleFactor;
        loadedModel.position.y = -box.min.y;

        carBodyMaterials = [];
        loadedModel.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              if (Array.isArray(child.material)) {
                carBodyMaterials.push(...child.material);
              } else {
                carBodyMaterials.push(child.material);
              }
            }
          }
        });

        carGroup = loadedModel;
        scene.add(carGroup);
        alert(`3D 모델 '${file.name}' 로드 성공! 쇼룸 무대에 배치되었습니다.`);
      };

      if (isFBX) {
        try {
          const fbxLoader = new THREE.FBXLoader();
          const fbxModel = fbxLoader.parse(contents, '');
          onModelParsed(fbxModel);
        } catch (err) {
          console.error("FBX Parse Error:", err);
          alert("FBX 파일 파싱 중 오류가 발생했습니다. 바이너리 FBX 파일인지 확인해주세요.");
        }
      } else {
        const loader = new THREE.GLTFLoader();
        loader.parse(contents, '', (gltf) => {
          onModelParsed(gltf.scene);
        }, (err) => {
          console.error("GLTF Parse Error:", err);
          alert("3D 모델 파싱 중 오류가 발생했습니다.");
        });
      }
    };

    reader.readAsArrayBuffer(file);
  });
}

/* =========================================================================
   9. WEB AUDIO API SYNTHESIZER
   ========================================================================= */
function initAudioSynthesizer() {
  const audioBtn = document.getElementById('btn-audio-toggle');
  if (!audioBtn) return;

  audioBtn.addEventListener('click', () => {
    if (!ShowroomState.audioPlaying) {
      startEngineAudio();
      audioBtn.innerHTML = '<i data-lucide="volume-2" class="w-4 h-4 text-showroom-gold"></i>';
      audioBtn.classList.add('border-showroom-gold/60', 'bg-showroom-gold/10');
      lucide.createIcons();
      ShowroomState.audioPlaying = true;
    } else {
      stopEngineAudio();
      audioBtn.innerHTML = '<i data-lucide="volume-x" class="w-4 h-4 text-slate-400"></i>';
      audioBtn.classList.remove('border-showroom-gold/60', 'bg-showroom-gold/10');
      lucide.createIcons();
      ShowroomState.audioPlaying = false;
    }
  });
}

function startEngineAudio() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();

    engineGain = audioCtx.createGain();
    engineGain.gain.setValueAtTime(0.08, audioCtx.currentTime);

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, audioCtx.currentTime);

    engineOsc = audioCtx.createOscillator();
    engineOsc.type = 'sawtooth';
    engineOsc.frequency.setValueAtTime(48, audioCtx.currentTime);

    const lfo = audioCtx.createOscillator();
    lfo.frequency.setValueAtTime(3.5, audioCtx.currentTime);
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.setValueAtTime(4.0, audioCtx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(engineOsc.frequency);

    engineOsc.connect(filter);
    filter.connect(engineGain);
    engineGain.connect(audioCtx.destination);

    lfo.start();
    engineOsc.start();
  } catch (e) {
    console.warn("Web Audio not supported:", e);
  }
}

function stopEngineAudio() {
  if (engineGain && audioCtx) {
    engineGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.2);
    setTimeout(() => {
      if (audioCtx && audioCtx.state !== 'closed') audioCtx.close();
    }, 250);
  }
}

/* =========================================================================
   10. PROJECTS GRID & 4-VIEW MODAL SYSTEM
   ========================================================================= */
let activeModalProject = null;
let activeModalView = 'hero';

function initProjectsGrid() {
  const grid = document.getElementById('projects-grid');
  if (!grid || typeof PORTFOLIO_DATA === 'undefined') return;

  renderProjects('all');

  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('bg-showroom-gold', 'text-black', 'font-semibold');
        b.classList.add('bg-showroom-800/80', 'text-slate-300');
      });
      btn.classList.add('bg-showroom-gold', 'text-black', 'font-semibold');
      btn.classList.remove('bg-showroom-800/80', 'text-slate-300');

      renderProjects(btn.dataset.filter);
    });
  });

  initProjectModal();
}

function renderProjects(filter) {
  const grid = document.getElementById('projects-grid');
  grid.innerHTML = '';

  const filtered = filter === 'all'
    ? PORTFOLIO_DATA.projects
    : PORTFOLIO_DATA.projects.filter(p => p.category === filter);

  filtered.forEach((p) => {
    const idx = PORTFOLIO_DATA.projects.indexOf(p) + 1;
    const num = String(idx).padStart(2, '0');
    const contain = p.thumbnailFit === 'contain';
    const featured = !!p.featured;

    const card = document.createElement('article');
    card.className = 'project-card group relative cursor-pointer flex flex-col bg-showroom-900 border border-white/[0.08] ' +
      (featured ? 'md:col-span-2 lg:flex-row' : '');
    card.onclick = () => openProjectModal(p);

    const tools = p.tools.slice(0, 6).map(t => `<span class="chip">${t}</span>`).join('');

    card.innerHTML = `
      <div class="card-media relative overflow-hidden bg-black ${featured ? 'lg:w-[56%] aspect-[16/10] lg:aspect-auto lg:min-h-[400px]' : 'aspect-[16/10]'}">
        <img src="${p.thumbnail}" alt="${p.title}"
          class="absolute inset-0 w-full h-full ${contain ? 'object-contain p-8 md:p-14' : 'object-cover'}"
          onerror="this.onerror=null; this.style.display='none';">
        <span class="absolute top-4 left-4 font-mono text-[11px] tracking-[0.16em] text-white/90">[ ${num} ]</span>
        ${p.badge ? `<span class="absolute top-4 right-4 px-2.5 py-1.5 bg-showroom-gold text-black font-mono text-[10px] font-bold uppercase tracking-[0.12em]">${p.badge}</span>` : ''}
      </div>
      <div class="flex flex-col justify-between flex-1 p-6 md:p-8 gap-8">
        <div>
          <div class="font-mono text-[10px] uppercase tracking-[0.18em] text-showroom-gold mb-3">${p.categoryName}</div>
          <h3 class="font-display font-bold uppercase leading-[1.06] tracking-tight text-white ${featured ? 'text-3xl md:text-5xl' : 'text-2xl md:text-3xl'}">${p.title}</h3>
          <p class="mt-4 text-sm text-slate-400 leading-relaxed ${featured ? 'line-clamp-5' : 'line-clamp-3'}">${p.description}</p>
        </div>
        <div>
          <div class="flex flex-wrap gap-1.5 mb-6">${tools}</div>
          <div class="card-cta inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-white">
            <span>View case</span><span aria-hidden="true">→</span>
          </div>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });
}

function initProjectModal() {
  const modal = document.getElementById('project-modal');
  const closeBtn = document.getElementById('modal-close-btn');

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });
  }

  // 4-View Switcher Buttons in Modal
  const viewTabBtns = document.querySelectorAll('.modal-tab-btn');
  viewTabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      viewTabBtns.forEach(b => {
        b.classList.remove('active', 'bg-showroom-gold', 'text-black', 'font-semibold');
        b.classList.add('text-slate-300');
      });
      btn.classList.add('active', 'bg-showroom-gold', 'text-black', 'font-semibold');
      btn.classList.remove('text-slate-300');

      activeModalView = btn.dataset.view;
      updateModalMediaView();
    });
  });
}

function openProjectModal(project) {
  activeModalProject = project;
  activeModalView = 'hero';

  const modal = document.getElementById('project-modal');
  if (!modal) return;

  document.getElementById('modal-category').textContent = project.categoryName;
  const titleEl = document.getElementById('modal-title');
  if (project.logo) {
    titleEl.innerHTML = `<div class="flex items-center flex-wrap gap-3"><img src="${project.logo}" alt="Logo" class="h-7 max-w-[130px] object-contain shrink-0"><span>${project.title}</span></div>`;
  } else {
    titleEl.textContent = project.title;
  }
  document.getElementById('modal-desc').textContent = project.description;

  // Reset Tab Buttons
  const viewTabBtns = document.querySelectorAll('.modal-tab-btn');
  viewTabBtns.forEach(b => {
    if (b.dataset.view === 'hero') {
      b.classList.add('active', 'bg-showroom-gold', 'text-black', 'font-semibold');
      b.classList.remove('text-slate-300');
    } else {
      b.classList.remove('active', 'bg-showroom-gold', 'text-black', 'font-semibold');
      b.classList.add('text-slate-300');
    }
  });

  updateModalMediaView();

  // Highlights
  const highlightsContainer = document.getElementById('modal-highlights');
  highlightsContainer.innerHTML = project.highlights.map(h => `
    <div class="flex items-start gap-2">
      <span class="text-showroom-gold">▹</span>
      <span>${h}</span>
    </div>
  `).join('');

  // Tools
  const toolsContainer = document.getElementById('modal-tools');
  toolsContainer.innerHTML = project.tools.map(t => `
    <span class="px-2 py-1 rounded bg-white/10 text-white font-mono">${t}</span>
  `).join('');

  // Specs
  const specsContainer = document.getElementById('modal-specs');
  specsContainer.innerHTML = Object.entries(project.specs).map(([key, val]) => `
    <div class="flex justify-between py-1 border-b border-white/5">
      <span class="text-slate-400">${key}:</span>
      <span class="text-showroom-gold font-bold">${val}</span>
    </div>
  `).join('');

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  lucide.createIcons();
}

function updateModalMediaView() {
  if (!activeModalProject) return;

  const mediaContainer = document.getElementById('modal-media');
  const fileHint = document.getElementById('modal-file-hint');
  const p = activeModalProject;

  // Expected standard file path for this view
  const expectedPath = `assets/projects/${p.id}/${activeModalView}.png`;
  if (fileHint) fileHint.textContent = `Target File: ${expectedPath}`;

  // View specific title & info
  const viewLabels = {
    hero: { title: "① High-End Studio Hero Render", desc: "스튜디오 조명 및 림 라이트 기반 최종 시네마틱 렌더" },
    wireframe: { title: "② Topology & Edge-Loop Wireframe", desc: "곡률 및 리플렉션 무결성을 보장하는 Maya SubD 와이어프레임 구조" },
    texture: { title: "③ Substance 4K PBR Texture Breakdown", desc: "Albedo, Normal, Roughness, Metallic 멀티 채널 분석" },
    detail: { title: "④ Mechanical Macro Close-up Detail", desc: "브레이크 캘리퍼, 그릴 메시, 휠 림 등 초근접 하드서페이스 디테일" }
  };

  const currentInfo = viewLabels[activeModalView] || viewLabels.hero;
  const fallbackImg = p.thumbnail;

  mediaContainer.innerHTML = `
    <div class="relative w-full h-full flex flex-col justify-between p-4 bg-gradient-to-b from-showroom-900/90 to-showroom-950">
      <div class="flex items-center justify-between text-xs font-mono z-10">
        <span class="text-showroom-gold font-bold flex items-center gap-2">
          <i data-lucide="eye" class="w-3.5 h-3.5"></i>
          ${currentInfo.title}
        </span>
        <span class="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
          Ready for Artist Replacement
        </span>
      </div>

      <!-- Main Media Center -->
      <div class="relative flex-1 w-full my-3 flex items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black/60 group">
        <img id="active-view-img" src="${expectedPath}" alt="${currentInfo.title}" class="max-w-full max-h-full object-contain" onerror="handleMissingViewImage(this, '${fallbackImg}', '${currentInfo.title}', '${p.title}')">
      </div>

      <!-- Bottom Status & Description -->
      <div class="flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-white/10 pt-2 z-10">
        <span>${currentInfo.desc}</span>
        <span class="text-showroom-gold">규격: 1920x1080 (16:9 PNG)</span>
      </div>
    </div>
  `;

  lucide.createIcons();
}

function handleMissingViewImage(imgElem, fallbackSrc, viewTitle, projectTitle) {
  // If user hasn't dropped the specific file yet, show high-tech blueprint fallback overlay
  imgElem.onerror = null;
  imgElem.src = fallbackSrc;
}

/* =========================================================================
   11. UNITY WEBGL LIVE DEMO MODAL INTEGRATION
   ========================================================================= */
function initDemoModal() {
  const demoLaunchBtns = document.querySelectorAll('.btn-launch-demo');
  const demoModal = document.getElementById('demo-modal');
  const demoCloseBtn = document.getElementById('demo-close-btn');

  demoLaunchBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (demoModal) {
        demoModal.classList.remove('hidden');
        demoModal.classList.add('flex');
      }
    });
  });

  if (demoCloseBtn && demoModal) {
    demoCloseBtn.addEventListener('click', () => {
      demoModal.classList.add('hidden');
      const iframe = document.getElementById('demo-iframe');
      if (iframe) iframe.src = '';
    });
  }

  const startServerBtn = document.getElementById('btn-connect-demo');
  if (startServerBtn) {
    startServerBtn.addEventListener('click', () => {
      const iframe = document.getElementById('demo-iframe');
      if (iframe) {
        iframe.src = 'http://127.0.0.1:8090/';
      }
    });
  }
}

/* =========================================================================
   12. RENDER LOOP & RESIZE
   ========================================================================= */
function onWindowResize() {
  const container = document.getElementById('canvas-container');
  if (!container || !camera || !renderer) return;

  const width = container.clientWidth;
  const height = container.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  if (composer) {
    composer.setSize(width, height);
  }
}

function animate() {
  requestAnimationFrame(animate);

  if (controls) {
    controls.update();
  }

  if (composer) {
    composer.render();
  } else if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}
