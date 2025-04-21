import '../css/styles.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createEarth } from './earth';
import { setupScene } from './scene'; 
import { fetchRawCloudData } from './fetch-request.js';
import { create3DTextureFromData } from './texture-utils';
import { setupMonthListeners } from './dom.js';

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
let cloudMesh;

function loadMonth(index) {
  const month = months[index].value;
  fetch(`http://127.0.0.1:5001/getWeatherData?month=${month}`)
  .then(res => res.json())
  .then(({ clwc, ciwc, shape }) => {
    const combined = clwc.map((v,i) => v + ciwc[i]);
    const cloudTexture3D = create3DTextureFromData(combined, shape);

    if (cloudMesh) scene.remove(cloudMesh); // removes old cloud mesh
    
    const cloudBox = new THREE.BoxGeometry(7, 7, 7); // Earth is roughly radius 3.5, so this fits around

    const cloudMaterial = new THREE.ShaderMaterial({
      uniforms: {
        u_data: { value: cloudTexture3D },
        u_size: { value: new THREE.Vector3(...shape) },
        u_cameraPos: { value: camera.position },
        u_lightDir: { value: new THREE.Vector3(1,1,1).normalize()},
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
  
        varying vec3 v_pos;
  
        vec3 toUVW(vec3 p) {
          return (p + vec3(3.5)) / 7.0;
        }
  
        void main() {
          vec3 rayOrigin = v_pos;
          vec3 rayDir = normalize(v_pos - u_cameraPos);
  
          float stepSize = 0.04;
          vec3 rayPos = rayOrigin;
          float accumulated = 0.0;
          float finalDensity = 0.0;
  
          for (int i=0; i<100; i++){
            vec3 uvw = toUVW(rayPos);
            if (any(lessThan(uvw, vec3(0.0))) || any(greaterThan(uvw, vec3(1.0)))) {
              break; // if outside volume, exit
            }
            float density = texture(u_data, uvw).r;
            density *= 900000.0;
            density = smoothstep(0.0, 0.08, density);
  
            // fade out towards edges to remove cubey look
            float distFromCenter = length(rayPos) / 3.5;
            float sphericalFade = smoothstep(1.0, 0.0, distFromCenter);
            density *= sphericalFade;
  
            vec3 grad = vec3(
              texture(u_data, uvw + vec3(0.01, 0.0, 0.0)).r - texture(u_data, uvw - vec3(0.01, 0.0, 0.0)).r,
              texture(u_data, uvw + vec3(0.01, 0.0, 0.0)).r - texture(u_data, uvw - vec3(0.0, 0.01, 0.0)).r,
              texture(u_data, uvw + vec3(0.01, 0.0, 0.0)).r - texture(u_data, uvw - vec3(0.0, 0.0, 0.01)).r
            );
            vec3 normal = normalize(grad);
            float light = clamp(dot(normal, u_lightDir), 0.0, 1.0);
  
            // apply lighting to density
            density *= light;
  
            finalDensity = density;
  
            accumulated += density * 0.12; // accumulated opacity
            if (accumulated >= 1.0) break;
  
            rayPos += rayDir * stepSize;
            }
  
            // Map density to color: bluish to white. Low density clouds icy and soft, high density clouds bright 
            float colorDensity = clamp(finalDensity * 5.0, 0.0, 1.0);
            vec3 cloudColor = mix(vec3(0.6,0.7,0.9), vec3(1.0), colorDensity);
            
            // final color with lighting and accumulation
            gl_FragColor = vec4(cloudColor, accumulated * 0.7);
          }
      `,
      transparent: true,
      depthWrite: false,
    });
  
    cloudMesh = new THREE.Mesh(cloudBox, cloudMaterial);
    scene.add(cloudMesh);

    document.getElementById('month-label').innerText = months[index].label;
  });
};
loadMonth(currentMonthIndex);

// Animate scene
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}



animate();

