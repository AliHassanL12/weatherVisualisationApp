import '../css/styles.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createEarth } from './earth';
import { setupScene } from './scene'; 
import { fetchRawCloudData } from './fetch-request.js';
import { create3DTextureFromData } from './texture-utils';

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

fetchRawCloudData().then(({ data: flatData, shape }) => {
  console.log(flatData.length, shape)
  const cloudTexture3D = create3DTextureFromData(flatData, shape);
  console.log(cloudTexture3D);
  const cloudBox = new THREE.BoxGeometry(7, 7, 7); // we make it a bit bigger than earth
  
  const cloudMaterial = new THREE.ShaderMaterial({
    uniforms: {
      u_data: { value: cloudTexture3D },
      u_size: { value: new THREE.Vector3(...shape) },
      u_cameraPos: { value: camera.position },
      u_density: { value: 2.5 },
    },
    vertexShader: `
      varying vec3 v_pos;
      void main() {
        v_pos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;
      precision highp sampler3D;
      uniform sampler3D u_data;
      uniform vec3 u_size;
      varying vec3 v_pos;

      void main() {
        vec3 uvw = (v_pos + vec3(3.25)) / 7.0; // normalize to 0-1
        float density = texture(u_data, uvw).r * 400000.0;
        density = smoothstep(0.0, 0.1, density);
        gl_FragColor = vec4(vec3(1.0), density * 0.5); // white clouds
      }
    `,
    transparent: true,
    depthWrite: false,
  });
  
  const cloudMesh = new THREE.Mesh(cloudBox, cloudMaterial);
  scene.add(cloudMesh);
})
// Animate scene
function animate() {
  requestAnimationFrame(animate);
  earthGroup.rotation.y += 0.003;
  renderer.render(scene, camera);
}



animate();

