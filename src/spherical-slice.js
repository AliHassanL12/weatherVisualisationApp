import * as THREE from 'three';

function createSphericalSlice(data3DTexure, textureShape, initialPressureIndex = 10) {
    const sliceRadius = 4.0;
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
            float amplified = value * 10000.0;
            gl_FragColor = vec4(vec3(amplified), 1.0);
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

function createTempSlice(data3DTexture, textureShape, initialPressureIndex = 0) {
    const sliceRadius = 4.0;
    const geometry = new THREE.SphereGeometry(sliceRadius, 128, 128);
    const material = new THREE.ShaderMaterial({
        transparent: true,
        uniforms: {
            uTexture3D: {value: data3DTexture},
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
        
        vec3 temperatureToColor(float t) {
            t = clamp((t - 240.0) / 60.0, 0.0, 1.0);
            return mix(vec3(0.0, 0.2, 1.0), vec3(1.0, 0.0, 0.0), t);
        }


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
            vec3 color = temperatureToColor(value);
            gl_FragColor = vec4(color, 0.6);
            }
        `,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.NormalBlending,
    });

    const sphere = new THREE.Mesh(geometry, material);
    sphere.name = 'SphericalTempSlice';
    return { sphere, material};

}
export {createSphericalSlice, createTempSlice};