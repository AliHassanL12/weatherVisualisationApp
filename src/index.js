import '../css/styles.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createEarth } from './earth';
import { setupScene } from './scene'; 

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

// Animate scene
function animate() {
  requestAnimationFrame(animate);
  earthGroup.rotation.y += 0.003;
  renderer.render(scene, camera);
}
animate();
