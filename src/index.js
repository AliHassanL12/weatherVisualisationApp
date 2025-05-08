import '../css/styles.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createEarth } from './earth';
import { setupScene } from './scene'; 
import { createSphericalSlice, createTempSlice } from './spherical-slice.js';
import { create3DTextureFromData } from './texture-utils';
import { setupMonthListeners, setupSliceSlider, trackMouse, setUIVisibility, updateLegend, setStatsCSS } from './dom.js';
import { benchmarkJSON, benchmarkBinary } from './benchmark-test.js';
import Stats from 'stats.js';

const stats = new Stats();
setStatsCSS(stats);


let loadStartTime = 0;
let heapBefore = 0;
let sphericalSliceRef = null;
let sphericalMaterialRef = null;

const tooltip = document.getElementById('tooltip');
const raycaster = new THREE.Raycaster();
let windMeshRef = null; 

const { scene, camera, renderer } = setupScene();

// Add ambient and directional lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Create Earth and add to scene
const textureLoader = new THREE.TextureLoader();
const earthGroup = createEarth(textureLoader);
scene.add(earthGroup);

// Orbit Controls
new OrbitControls(camera, renderer.domElement);

// Handle window resize
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

const months = [
  { label: 'Jan 2020', value: '2020-01-01'},
  { label: 'Feb 2020', value: '2020-02-01'},
  { label: 'Mar 2020', value: '2020-03-01'},
  { label: 'Apr 2020', value: '2020-04-01'},
  { label: 'May 2020', value: '2020-05-01'},
  { label: 'Jun 2020', value: '2020-06-01'},
  { label: 'Jul 2020', value: '2020-07-01'},
  { label: 'Aug 2020', value: '2020-08-01'},
  { label: 'Sep 2020', value: '2020-09-01'},
  { label: 'Oct 2020', value: '2020-10-01'},
  { label: 'Nov 2020', value: '2020-11-01'},
  { label: 'Dec 2020', value: '2020-12-01'}
];


setupMonthListeners(loadMonth, months);
let currentMonthIndex = 0;
const monthTextures = {};
let cloudMesh;

function loadMonth(index) {
  if (monthTextures[index]) {
    applyVisualizationMode(index);
    return;
  }

  const month = months[index].value;
  
  if (performance.memory) {
    heapBefore = performance.memory.usedJSHeapSize;
    console.log(
      `[${months[index].label}] Heap before: ${(heapBefore/1024/1024).toFixed(2)} MB`
        );
      }
    

  loadStartTime = performance.now();
  fetch(`http://127.0.0.1:5001/getWeatherData?month=${month}`)
    .then(res => res.json())
    .then(({ clwc, ciwc, shape, temperature, temperature_shape, wind_u, wind_v, wind_shape, max_cloud_value, min_temps, max_temps }) => {
      const combined = clwc.map((v, i) => v + ciwc[i]);
      const cloudTexture3D = create3DTextureFromData(combined, shape);

      const tempTexture3D = create3DTextureFromData(temperature, temperature_shape);
      
      monthTextures[index] = {
        texture: cloudTexture3D,
        tempTexture: tempTexture3D,
        minTemps: min_temps,
        maxTemps: max_temps,
        shape,
        wind_u,
        wind_v,
        wind_shape,
        maxCloudValue: max_cloud_value
      };
      applyVisualizationMode(index);

      const loadTime = (performance.now() - loadStartTime).toFixed(1);
      console.log(`[${months[index].label}] Load time: ${loadTime} ms`);

      if (performance.memory) {
        const heapAfter = performance.memory.usedJSHeapSize;
        const usedMB   = (heapAfter/1024/1024).toFixed(2);
        const deltaMB  = ((heapAfter - heapBefore)/1024/1024).toFixed(2);
        console.log(`[${months[index].label}] Heap after:  ${usedMB} MB`);
        console.log(`[${months[index].label}] Δ Heap: ${deltaMB} MB`);
      }
      if (index === 0) {
        for (let i = 1; i < months.length; i++) {
          const preloadMonth = months[i].value;
          fetch(`http://127.0.0.1:5001/getWeatherData?month=${preloadMonth}`)
            .then(res => res.json())
            .then(({ clwc, ciwc, shape }) => {
              const combined = clwc.map((v, j) => v + ciwc[j]);
              const texture = create3DTextureFromData(combined, shape);
              monthTextures[i] = { texture, shape };
            });
        }
      }
    });
}


function applyCloudTexture(texture, shape, index) {
  if (cloudMesh) scene.remove(cloudMesh); // removes old cloud mesh
  const cloudBox = new THREE.BoxGeometry(7, 7, 7); // Earth is roughly radius 3.5, so this fits around

  const cloudMaterial = new THREE.ShaderMaterial({
    uniforms: {
      u_data: { value: texture },
      u_size: { value: new THREE.Vector3(...shape) },
      u_cameraPos: { value: camera.position },
      u_lightDir: { value: new THREE.Vector3(1,1,1).normalize()},
      u_sliceZ: { value: 1.0 },
      u_horizontalSlice: {value: false}
    },
    vertexShader: `
      varying vec3 v_pos;
      void main() {
        // Send position to fragment shader
        v_pos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
precision highp float;
precision highp sampler3D;

uniform sampler3D u_data;
uniform vec3 u_size;
uniform vec3 u_cameraPos;
uniform vec3 u_lightDir;
uniform float u_sliceZ;
uniform bool u_horizontalSlice;

varying vec3 v_pos;

bool intersectBox(vec3 rayOrigin, vec3 rayDir, out float tNear, out float tFar) {
  vec3 boxMin = vec3(-3.5);
  vec3 boxMax = vec3( 3.5);
  vec3 invDir = 1.0 / rayDir;

  vec3 t0s = (boxMin - rayOrigin) * invDir;
  vec3 t1s = (boxMax - rayOrigin) * invDir;

  vec3 tsmaller = min(t0s, t1s);
  vec3 tbigger  = max(t0s, t1s);

  tNear = max(max(tsmaller.x, tsmaller.y), tsmaller.z);
  tFar  = min(min(tbigger.x, tbigger.y), tbigger.z);

  return tFar > max(tNear, 0.0);
}


vec3 toUVW(vec3 p) {
  return (p + vec3(3.5)) / 7.0;
}

void main() {
  vec3 rayDir = normalize(v_pos - u_cameraPos);
  float tEntry, tExit;
  if (!intersectBox(u_cameraPos, rayDir, tEntry, tExit)) {
    discard; // ray misses cube
  }
  vec3 rayOrigin = u_cameraPos + rayDir * tEntry;


  float stepSize = 0.05;
  vec3 rayPos = rayOrigin;
  float accumulated = 0.0;
  float finalDensity = 0.0;
  bool hitSlice = false;

  for (int i = 0; i < 60; i++) {
    vec3 uvw = toUVW(rayPos);
    float sliceCoord = u_horizontalSlice ? uvw.y : uvw.z;
    if (abs(sliceCoord - u_sliceZ) > 0.1) {
      rayPos += rayDir * stepSize;
      continue;
    }

    hitSlice = true;

    if (any(lessThan(uvw, vec3(0.0))) || any(greaterThan(uvw, vec3(1.0)))) {
      break; // if outside volume, exit
    }

    float density = texture(u_data, uvw).r;
    density *= 900000.0 * 15.0;
    density = smoothstep(0.0, 0.08, density);

    // fade out towards edges to remove cubey look
    float distFromCenter = length(rayPos) / 3.5;
    float sphericalFade = smoothstep(1.0, 0.0, distFromCenter);
    density *= sphericalFade;

    vec3 grad = vec3(
      texture(u_data, uvw + vec3(0.01, 0.0, 0.0)).r - texture(u_data, uvw - vec3(0.01, 0.0, 0.0)).r,
      texture(u_data, uvw + vec3(0.0, 0.01, 0.0)).r - texture(u_data, uvw - vec3(0.0, 0.01, 0.0)).r,
      texture(u_data, uvw + vec3(0.0, 0.0, 0.01)).r - texture(u_data, uvw - vec3(0.0, 0.0, 0.01)).r
    );
    vec3 normal = normalize(grad);
    float light = clamp(dot(normal, u_lightDir), 0.0, 1.0);

    density *= light;
    finalDensity = density;

    accumulated += density * 0.12;
    if (accumulated >= 1.0) break;

    rayPos += rayDir * stepSize;
  }

  if (!hitSlice) discard;

  if (accumulated == 0.0) {
    gl_FragColor = vec4(1.0, 0.0, 0.0, 0.2); // Faint red = hit slice but no cloud
  } else {
    float colorDensity = clamp(finalDensity * 5.0, 0.0, 1.0);
    vec3 cloudColor = mix(vec3(0.6, 0.7, 0.9), vec3(1.0), colorDensity);
    gl_FragColor = vec4(cloudColor, accumulated * 1.0);
  }
}
    `,
    transparent: true,
    depthWrite: false,
  });
  setupSliceSlider(cloudMaterial, 'u_sliceZ', 'cloudSlice');

  cloudMesh = new THREE.Mesh(cloudBox, cloudMaterial);
  scene.add(cloudMesh);

  document.getElementById('month-label').innerText = months[index].label;
}


function applyVisualizationMode(index) {
  const mode = document.getElementById('modeSelect').value;
  setUIVisibility(mode);
  const data = monthTextures[index];

  if (cloudMesh) {
    scene.remove(cloudMesh);
    cloudMesh = null;
  }
  if (sphericalSliceRef) {
    scene.remove(sphericalSliceRef);
    sphericalSliceRef = null;
    sphericalMaterialRef = null;
  }
  windGroup.clear();
  windGroup.visible = false;
  if (mode === 'clouds') {
    applyCloudTexture(data.texture, data.shape, index);
  } else if (mode === 'cloudSlice') {
    console.log("Texture shape:", data.shape);
    createSphericalCloudSlice(data.texture, data.shape, data.maxCloudValue);
  } else if (mode === 'wind') {
    renderWindVectors(data.wind_u, data.wind_v, data.wind_shape);
    windGroup.visible = true;
  } else if (mode === 'tempSlice') {
    createSphericalTempSlice(data.tempTexture, data.shape, data.minTemps, data.maxTemps);
  }
}


document.getElementById('modeSelect').addEventListener('change', () => {
  applyVisualizationMode(currentMonthIndex);
});

let windGroup = new THREE.Group();
scene.add(windGroup);

function renderWindVectors(wind_u, wind_v, shape) {
  if (cloudMesh) {
    scene.remove(cloudMesh);
    cloudMesh = null;
  }  
  windGroup.clear();

  const [latCount, lonCount] = shape;
  const radius = 3.5
  const arrowLength = 0.3;

  const dummy = new THREE.Object3D();
  const dir = new THREE.Vector3();
  const arrowGeometry = new THREE.CylinderGeometry(0, 0.02, arrowLength, 5, 1);
  

  const vertexShader = `
  attribute vec3 instanceColor;
  varying vec3 vColor;
  void main() {
    vColor = instanceColor;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  }
  `;

  const fragmentShader = `
  varying vec3 vColor;
  void main() {
    gl_FragColor = vec4(vColor, 1.0);
  }
  `;

  const arrowMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
  });

  const instanceCount = latCount * lonCount;
  const mesh = new THREE.InstancedMesh(arrowGeometry, arrowMaterial, instanceCount);
  const colorArray = new Float32Array(instanceCount * 3);


  let i = 0;
  for (let latIdx = 0; latIdx < latCount; latIdx++) {
    const lat = 90 - (180 / (latCount - 1)) * latIdx;
    const phi = (90 - lat) * Math.PI / 180;

    for (let lonIdx = 0; lonIdx < lonCount; lonIdx++) {
      const lon = -180 + (360 / (lonCount - 1)) * lonIdx;
      const theta = (lon + 180) * Math.PI / 180;

      const index = latIdx * lonCount + lonIdx;
      const u = wind_u[index];
      const v = wind_v[index];
      const speed = Math.sqrt(u * u + v * v);

      if (u === 0 && v === 0) continue;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);
      const origin = new THREE.Vector3(x, y, z);

      // calculating local east tangent vector at the current point, pointing eastwards (right from true north)
      const east = new THREE.Vector3(-Math.sin(theta), 0, Math.cos(theta));

      // This is our local north tangent vector
      const north = new THREE.Vector3(
        -Math.cos(theta) * Math.cos(phi),
        Math.sin(phi),
        -Math.sin(theta) * Math.cos(phi)
      );

      // This uses our wind data (u and v which are in east and north directions) and turns them into a 3D vector
      const dir = new THREE.Vector3()
      .addScaledVector(east, u)
      .addScaledVector(north, v)
      .normalize();

      dummy.position.copy(origin);
      dummy.lookAt(origin.clone().add(dir));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      const color = new THREE.Color();
      color.setHSL((1.0 - Math.min(speed / 50, 1.0)) * 0.7, 1.0, 0.5); 
      color.toArray(colorArray, i * 3);
      i++;
    }
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.geometry.setAttribute(
    'instanceColor',
    new THREE.InstancedBufferAttribute(colorArray, 3)
  );
  windMeshRef = mesh;
  windGroup.add(mesh);
}

function createSphericalCloudSlice(texture, shape, maxValue) {
  if (sphericalSliceRef) {
    scene.remove(sphericalSliceRef);
    sphericalSliceRef = null;
    sphericalMaterialRef = null;
  }
  const { sphere, material } = createSphericalSlice(texture, shape, maxValue);
  sphericalSliceRef = sphere;
  sphericalMaterialRef = material;
  scene.add(sphericalSliceRef);
  setupSliceSlider(material, 'uPressureIndex', 'cloudSlice');
}

function createSphericalTempSlice(texture, shape, minTemps, maxTemps) {
  const globalMinT = Math.min(...minTemps);
  const globalMaxT = Math.max(...maxTemps);

  const { sphere, material } = createTempSlice(texture, shape, 0, minTemps, maxTemps);

  material.uniforms.uGlobalMinT.value = globalMinT;
  material.uniforms.uGlobalMaxT.value = globalMaxT;

  scene.add(sphere);

  setupSliceSlider(material, 'uPressureIndex', 'tempSlice');
  updateLegend(globalMinT, globalMaxT);
  return sphere;
}



loadMonth(currentMonthIndex);

// Animate scene
function animate() {
  stats.begin();
  renderer.render(scene, camera);
  stats.end();
  requestAnimationFrame(animate);
}

trackMouse(
  raycaster,
  camera,
  () => {
    const mode = document.getElementById('modeSelect').value;
    if (mode === 'wind') {
      return { mesh: windMeshRef, mode };
    } else if (mode === 'cloudSlice') {
      return { mesh: sphericalSliceRef, mode };
    } else {
      return { mesh: cloudMesh, mode };
    }
  },
  () => monthTextures[currentMonthIndex],
  tooltip
);


animate();

