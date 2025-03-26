import '../css/styles.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createEarth } from './earth';
import { setupScene } from './scene'; 
import { fetchWeatherData, convertToCartesian } from './fetch-request.js';

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

fetchWeatherData().then(data => {
    if (!data) return;

    // the data looks like this: [37 pressure levels] [90 latitude values] [180 longitude values]
    const clwcData = data; 

    // get length of pressure levels, of latitude, and longitude arrays
    const pressureLevels = clwcData.length;
    const numLat = clwcData[0].length;
    const numLon = clwcData[0][0].length;

    // values are spaced evenly across either 180 or 360, depending on lat or lon. E.g 180 / 90 = 2 degrees step
    const latStep = 180 / numLat;
    const lonStep = 360 / numLon;
    const startLat = 90;
    const startLon = -180;
    console.log(data);

    // create the data points with color red, and use instancedMesh so its only one draw() for all points. 
    const pointMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const geometry = new THREE.SphereGeometry(0.015, 2, 2);

    const temp = new THREE.Object3D();
    // instanced mesh is a GPU accelereated way of drawing the same gemeotry many times without creating a new mesh every time
    const mesh = new THREE.InstancedMesh(geometry, pointMaterial, pressureLevels * numLat * numLon); // the multiplication tells how many max instances we will draw (599,400 points)
    let index = 0;

    for (let p = 0; p < pressureLevels; p++) {
        for (let i = 0; i < numLat; i++) {
            for (let j = 0; j < numLon; j++) {
                //get data value at [p][i][j]
                const value = clwcData[p][i][j];
                if (value < 1e-8) continue;
    
                const lat = startLat - i * latStep;
                const lon = startLon + j * lonStep;

                // to give each pressure level a slightly different radius, so they're not all stacked on the same global radius
                const heightBoost = p * 0.01; 

                // convert lat, lon to 3D cartesian to actually plot on globe
                const { x, y, z } = convertToCartesian(lat, lon, 3.05 + heightBoost);

                // finally set position of each instanced point
                temp.position.set(x, y, z);
                temp.updateMatrix();
                mesh.setMatrixAt(index++, temp.matrix);
            }
        }   
    }


    mesh.count = index;
    mesh.instanceMatrix.needsUpdate = true;
    scene.add(mesh);

    console.log(`Instanced points added: ${index}`);
});

animate();

