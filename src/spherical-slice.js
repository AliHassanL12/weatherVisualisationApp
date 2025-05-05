import * as THREE from 'three';

function createSphericalSlice(data3DTexure, textureShape, initialPressureIndex = 5) {
    const sliceRadius = 1.01;
    const geometry = new THREE.SphereGeometry(sliceRadius, 128, 128);
    const material = new THREE.ShaderMaterial({
        transparent: true,
        uniforms: {
            uTexture3D: {value: data3DTexure},
            uPressureIndex: { value: initialPressureIndex},
            uTextureShape: { value: new THREE.Vector3(...textureShape)},
        },
        vertexShader:`
        varying vec3 vPosition;
        void main() {
            vPosition = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        } 
        `,
        fragmentShader: `
        precision highp float;
        uniform sampler3D uTexture3D;
        uniform float uPressureIndex;
        uniform vec3 uTextureShape;
        varying vec3 vPosition;

        void main() {
            float lat = asin(vPosition.y);
            float lon = atan(vPosition.z, vPosition.x);
            float u = (lon + 3.1415926) / (2.0 * 3.1415926);
            float v = (lat + 3.1415926 / 2.0) / 3.1415926;
            float x = u;
            float y = v;
            float z = uPressureIndex / (uTextureShape.x - 1.0);
            vec3 texCoord = vec3(z, y, x);
            float value = texture(uTexture3D, texCoord).r;
            gl_FragColor = vec4(vec3(value), value);
            }
        `,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    });

    const sphere = new THREE.Mesh(geometry, material);
    sphere.name = 'SphericalSlice';
    return { sphere, material};
}

export {createSphericalSlice}