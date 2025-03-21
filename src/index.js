
import * as THREE from 'three';
import earthImage from './images/test-marble.jpg';
import { OrbitControls, ThreeMFLoader } from 'three/examples/jsm/Addons.js';
import '../css/styles.css';
import { fetchWeatherData, convertToCartesian } from './fetch-request';
import cloudTextureMap from './images/cloud-texture.png';


const w = window.innerWidth;
const h = window.innerHeight;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;
const renderer = new THREE.WebGLRenderer({antialias: true});

// set canvas size to full screen size 
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);

// set the axis of the earth

export const earthGroup = new THREE.Group();
scene.add(earthGroup);
earthGroup.rotation.z = -23*4 * Math.PI / 180; // Earth's axial tilt (23.4 degrees) in radians

new OrbitControls(camera, renderer.domElement);

// create spehere and add to the scene
export const sphereRadius = 3; 
const geometry = new THREE.IcosahedronGeometry(sphereRadius, 9);
const textureLoader = new THREE.TextureLoader();
const earthTexture = textureLoader.load(earthImage);


const material = new THREE.MeshStandardMaterial({ 
    map: earthTexture,
});
  
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

//Set direction from which light is coming
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
earthGroup.add(directionalLight);
const sphere = new THREE.Mesh(geometry, material);
earthGroup.add(sphere);

// Adding cloud layer

const cloudGeometry = new THREE.SphereGeometry(sphereRadius * 1.01, 64, 64) // a bit bigger than art, so envelops
const cloudTexture = textureLoader.load(cloudTextureMap);
const cloudMaterial = new THREE.MeshStandardMaterial({
    map: cloudTexture,
    transparent: true, 
    opacity: 0.7,
})
const cloudSphere = new THREE.Mesh(cloudGeometry, cloudMaterial);
earthGroup.add(cloudSphere);
// animate the sphere rotating
function animate() {
    requestAnimationFrame(animate);
    earthGroup.rotation.y += 0.003; 
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

animate();

fetchWeatherData();