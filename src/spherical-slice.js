import * as THREE from 'three';

function createSphericalSlice(data3DTexture, textureShape, maxCloudValue, initialPressureIndex = 10) {
    const sliceRadius = 4.0;
    const geometry = new THREE.SphereGeometry(sliceRadius, 128, 128);
    const material = new THREE.ShaderMaterial({
        transparent: true,
        uniforms: {
            uTexture3D: {value: data3DTexture},
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
        depthWrite: true,
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
            uGlobalMinT: { value: 0.0 },
            uGlobalMaxT: { value: 0.0 },
            uBandWidth: { value: 5.0 },
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
        precision highp sampler3D;

        uniform sampler3D uTexture3D;
        uniform float uPressureIndex;
        uniform vec3 uTextureShape;
        varying vec3 vPosition;

        uniform float uGlobalMinT;
        uniform float uGlobalMaxT;
        uniform float uBandWidth;

        vec3 temperatureToColor(float tNorm) {
        // diverging blue→white→red
            if (tNorm < 0.5) {
                return mix(vec3(0.0,0.2,1.0), vec3(1.0), tNorm * 2.0);
                } else {
                return mix(vec3(1.0), vec3(1.0,0.0,0.0), (tNorm - 0.5) * 2.0);
                }
            }

        void main() {
        float lat = asin(vPosition.y);
        float lon = atan(vPosition.z, vPosition.x);
        float u = (lon + 3.1415926) / (2.0 * 3.1415926);
        float v = (lat + 3.1415926/2.0) / 3.1415926;
        float z = uPressureIndex / (uTextureShape.x - 1.0);
        vec3 texCoord = vec3(z, v, u);

        // sample raw temperature
        float rawT = texture(uTexture3D, texCoord).r;

        float bandIdx = floor((rawT - uGlobalMinT) / uBandWidth);
        float bandsTot = ceil((uGlobalMaxT - uGlobalMinT) / uBandWidth);
        float tNormBand = clamp(bandIdx / (bandsTot - 1.0), 0.0, 1.0);
        vec3 color = temperatureToColor(tNormBand);
        gl_FragColor = vec4(color, 0.6);
    }
        `,
        side: THREE.FrontSide,
        depthWrite: true,
        blending: THREE.NormalBlending,
    });

    const sphere = new THREE.Mesh(geometry, material);
    sphere.name = 'SphericalTempSlice';
    return { sphere, material};

}
export {createSphericalSlice, createTempSlice};