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
  const cloudBox = new THREE.BoxGeometry(7, 7, 7); // Earth is roughly radius 3.5, so this fits around

  const cloudMaterial = new THREE.ShaderMaterial({
    uniforms: {
      u_data: { value: cloudTexture3D },
      u_size: { value: new THREE.Vector3(...shape) },
      u_cameraPos: { value: camera.position },
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

          accumulated += density * 0.12; // accumulated opacity
          if (accumulated >= 1.0) break;

          rayPos += rayDir * stepSize;
          }

          gl_FragColor = vec4(vec3(1.0), accumulated * 0.7); // white cloud
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

