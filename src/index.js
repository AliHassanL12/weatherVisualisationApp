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
  const cloudTexture3D = create3DTextureFromData(flatData, shape);

  // Create a cube slightly bigger than Earth to hold the cloud volume
  const cloudBox = new THREE.BoxGeometry(6, 6, 6); // Earth is roughly radius 3.5, so this fits around

  const cloudMaterial = new THREE.ShaderMaterial({
    uniforms: {
      u_data: { value: cloudTexture3D },
      u_size: { value: new THREE.Vector3(...shape) },
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
      varying vec3 v_pos;

      void main() {
        vec3 uvw = (v_pos + vec3(3.5)) / 7.0;
        float val = texture(u_data, uvw).r;
        val *= 400000.0;
        val = smoothstep(0.0, 0.1, val);
        gl_FragColor = vec4(1.0, 1.0, 1.0, val * 0.5); // solid red semi-transparent
      }
    `,
    transparent: true,
    depthWrite: false,
  });

  const cloudMesh = new THREE.Mesh(cloudBox, cloudMaterial);
  scene.add(cloudMesh);
});

// Animate scene
function animate() {
  requestAnimationFrame(animate);
  earthGroup.rotation.y += 0.003;
  renderer.render(scene, camera);
}



animate();

