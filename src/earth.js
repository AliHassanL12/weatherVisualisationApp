import * as THREE from 'three';
import earthImage from './images/test-marble.jpg';

const sphereRadius = 3;

function createEarth(textureLoader) {
    const earthGroup = new THREE.Group();
    earthGroup.rotation.z = -23.4 * Math.PI / 180;

    const geometry = new THREE.IcosahedronGeometry(sphereRadius, 9);
    const texture = textureLoader.load(earthImage);
    const material = new THREE.MeshStandardMaterial({ map: texture });

    const mesh = new THREE.Mesh(geometry, material);
    earthGroup.add(mesh);
    return earthGroup;
}

export {
    sphereRadius,
    createEarth
}

