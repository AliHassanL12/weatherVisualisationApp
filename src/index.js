import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

// set canvas size to full screen size 
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// create spehere and add to the scene
const geometry = new THREE.SphereGeometry(5, 32, 32);
const material = new THREE.MeshBasicMaterial({ color: 0x0077ff, wireframe: true });
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