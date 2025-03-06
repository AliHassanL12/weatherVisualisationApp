import * as THREE from 'three';
import earthImage from './images/earth-image.jpg';
import '../css/styles.css';
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

// set canvas size to full screen size 
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// create spehere and add to the scene
const geometry = new THREE.SphereGeometry(5, 32, 32);
const textureLoader = new THREE.TextureLoader();
const earthTexture = textureLoader.load(earthImage);
const material = new THREE.MeshBasicMaterial({ map: earthTexture });
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

// set camerate position
camera.position.z = 10;

// animate the sphere rotating
function animate() {
    requestAnimationFrame(animate);
    sphere.rotation.y += 0.01; 
    renderer.render(scene, camera);
}
animate();