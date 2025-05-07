import * as THREE from 'three';

function createSphericalSlice(data3DTexure, textureShape, maxCloudValue, initialPressureIndex = 10) {
    const sliceRadius = 4.0;
    const geometry = new THREE.SphereGeometry(sliceRadius, 128, 128);
    const material = new THREE.ShaderMaterial({
        transparent: true,
        uniforms: {
            uTexture3D: {value: data3DTexure},
            uPressureIndex: { value: initialPressureIndex},
            uTextureShape: { value: new THREE.Vector3(...textureShape)},
            uMaxValue: { value: maxCloudValue }
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
        uniform float uMaxValue;

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
            float norm = clamp(value / uMaxValue, 0.0, 1.0); // normalise based on a known max value
            float visibility = smoothstep(0.02, 0.3, norm);
            gl_FragColor = vec4(vec3(visibility), 1.0);
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

function createTempSlice(data3DTexture, textureShape, initialPressureIndex = 0, minTemps, maxTemps) {
    const sliceRadius = 4.0;
    const geometry = new THREE.SphereGeometry(sliceRadius, 128, 128);
    const material = new THREE.ShaderMaterial({
        transparent: true,
        uniforms: {
            uTexture3D: {value: data3DTexture},
            uPressureIndex: { value: initialPressureIndex},
            uTextureShape: { value: new THREE.Vector3(...textureShape)},
            uMinTemps: { value: new Float32Array(minTemps) },
            uMaxTemps: { value: new Float32Array(maxTemps) },
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
        uniform float uMinTemps[37];
        uniform float uMaxTemps[37];

        
        vec3 temperatureToColor(float t, float minT, float maxT) {
            t = clamp((t - minT) / (maxT - minT), 0.0, 1.0);
            if (t < 0.5) {
                return mix(vec3(0.0, 0.2, 1.0), vec3(1.0), t * 2.0);  // Blue → White
            } else {
                return mix(vec3(1.0), vec3(1.0, 0.0, 0.0), (t - 0.5) * 2.0);  // White → Red
            }  
        }


        void main() {
            int level = int(uPressureIndex + 0.5);
            float minT = uMinTemps[level];
            float maxT = uMaxTemps[level];
            float lat = asin(vPosition.y);
            float lon = atan(vPosition.z, vPosition.x);
            float u = (lon + 3.1415926) / (2.0 * 3.1415926);
            float v = (lat + 3.1415926 / 2.0) / 3.1415926;
            float x = u;
            float y = v;
            float z = (uTextureShape.x - 1.0 - uPressureIndex) / (uTextureShape.x - 1.0);
            vec3 texCoord = vec3(z, y, x);
            float value = texture(uTexture3D, texCoord).r;
            vec3 color = temperatureToColor(value, minT, maxT);
            gl_FragColor = vec4(color, 0.6);
            }
        `,
        side: THREE.FrontSide,
        depthWrite: false,
        blending: THREE.NormalBlending,
    });

    const sphere = new THREE.Mesh(geometry, material);
    sphere.name = 'SphericalTempSlice';
    return { sphere, material};

}
export {createSphericalSlice, createTempSlice};