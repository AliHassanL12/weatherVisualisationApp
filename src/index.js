import * as THREE from 'three';
import earthImage from './images/earthmap1k.jpg';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import '../css/styles.css';
const w = window.innerWidth;
const h = window.innerHeight;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 10;
const renderer = new THREE.WebGLRenderer({antialias: true});

// set canvas size to full screen size 
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);

new OrbitControls(camera, renderer.domElement);

// create spehere and add to the scene
const geometry = new THREE.IcosahedronGeometry(3, 14);
const textureLoader = new THREE.TextureLoader();
const earthTexture = textureLoader.load(earthImage);


const material = new THREE.MeshStandardMaterial({ 
    map: earthTexture,
    flatshading: true, 
});
  
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

//Set direction from which light is coming
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);



// animate the sphere rotating
function animate() {
    requestAnimationFrame(animate);
    sphere.rotation.y += 0.001; 
    renderer.render(scene, camera);
}
animate();